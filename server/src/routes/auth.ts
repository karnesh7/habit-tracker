import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { isValidTimezone } from '../utils/timezone.js';
import { validateBody } from '../middleware/validate.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod schemas for input validation
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  timezone: z.string().refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone (e.g. Asia/Kolkata, America/New_York, UTC)',
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updateTimezoneSchema = z.object({
  timezone: z.string().refine((tz) => isValidTimezone(tz), {
    message: 'Invalid IANA timezone (e.g. Asia/Kolkata, America/New_York, UTC)',
  }),
});

// Utility to generate JWT token
function generateToken(user: { id: string; email: string; timezone: string }) {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(
    { userId: user.id, email: user.email, timezone: user.timezone },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', validateBody(signupSchema), async (req, res): Promise<void> => {
  try {
    const { email, password, timezone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        timezone,
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// POST /api/auth/login
router.post('/login', validateBody(loginSchema), async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, timezone: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PATCH /api/auth/timezone (Bonus: Timezone updates)
router.patch('/timezone', authenticateToken, validateBody(updateTimezoneSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { timezone } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { timezone },
      select: { id: true, email: true, timezone: true },
    });

    const token = generateToken(updatedUser);

    res.json({
      message: 'Timezone updated successfully',
      user: updatedUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update timezone' });
  }
});

export default router;
