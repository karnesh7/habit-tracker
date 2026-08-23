import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  getLocalDateString,
  getTodayLocalDateString,
  isFutureLocalDate,
  isBeforeHabitCreationDate,
} from '../utils/timezone.js';
import { calculateStreaks } from '../utils/streakCalculator.js';
import { Prisma } from '@prisma/client';

const router = Router();

// Apply auth middleware to all habit endpoints
router.use(authenticateToken);

const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100),
  description: z.string().max(500).optional(),
});

const checkInSchema = z.object({
  // Can provide explicit local date ('YYYY-MM-DD') or ISO UTC timestamp string
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  timestamp: z.string().datetime().optional(),
});

// GET /api/habits - List user's habits with computed server-side streaks
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userTimezone = req.user!.timezone;

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        checkIns: {
          select: { localDate: true, utcTimestamp: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const habitsWithStreaks = habits.map((habit) => {
      const localDates = habit.checkIns.map((c) => c.localDate);
      const streakInfo = calculateStreaks(localDates, userTimezone);

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        createdAt: habit.createdAt,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        isCompletedToday: streakInfo.isCompletedToday,
        lastCheckInLocalDate: streakInfo.lastCheckInLocalDate,
        totalCheckIns: habit.checkIns.length,
      };
    });

    res.json({ habits: habitsWithStreaks });
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});

// POST /api/habits - Create a new habit
router.post('/', validateBody(createHabitSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        userId,
      },
    });

    res.status(201).json({
      message: 'Habit created successfully',
      habit: {
        ...habit,
        currentStreak: 0,
        longestStreak: 0,
        isCompletedToday: false,
        lastCheckInLocalDate: null,
        totalCheckIns: 0,
      },
    });
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Failed to create habit' });
  }
});

// GET /api/habits/:id - Get single habit with full check-in history
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userTimezone = req.user!.timezone;
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId },
      include: {
        checkIns: {
          orderBy: { localDate: 'desc' },
        },
      },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found or access denied' });
      return;
    }

    const localDates = habit.checkIns.map((c) => c.localDate);
    const streakInfo = calculateStreaks(localDates, userTimezone);

    res.json({
      habit: {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        createdAt: habit.createdAt,
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        isCompletedToday: streakInfo.isCompletedToday,
        lastCheckInLocalDate: streakInfo.lastCheckInLocalDate,
        totalCheckIns: habit.checkIns.length,
        checkIns: habit.checkIns,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch habit details' });
  }
});

// POST /api/habits/:id/check-in - Record a check-in for today or a backfilled local date
router.post('/:id/check-in', validateBody(checkInSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userTimezone = req.user!.timezone;
    const { id } = req.params;
    const { date: customLocalDate, timestamp: customTimestamp } = req.body;

    // 1. Verify habit ownership
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found or access denied' });
      return;
    }

    // 2. Determine local date ('YYYY-MM-DD') and UTC instant
    let targetLocalDate: string;
    let utcTimestamp: Date;

    if (customLocalDate) {
      targetLocalDate = customLocalDate;
      // Construct UTC date at noon to avoid boundary shifting issues
      utcTimestamp = new Date(`${customLocalDate}T12:00:00.000Z`);
    } else if (customTimestamp) {
      utcTimestamp = new Date(customTimestamp);
      targetLocalDate = getLocalDateString(utcTimestamp, userTimezone);
    } else {
      utcTimestamp = new Date();
      targetLocalDate = getTodayLocalDateString(userTimezone);
    }

    // 3. Validation: Future date check
    if (isFutureLocalDate(targetLocalDate, userTimezone)) {
      res.status(400).json({
        error: `Cannot check in for local date ${targetLocalDate} because it is in your local future (${userTimezone}).`,
      });
      return;
    }

    // 4. Validation: Date before habit creation check
    if (isBeforeHabitCreationDate(targetLocalDate, habit.createdAt, userTimezone)) {
      const creationLocalDate = getLocalDateString(habit.createdAt, userTimezone);
      res.status(400).json({
        error: `Cannot check in for local date ${targetLocalDate} because it is prior to the habit's creation date (${creationLocalDate}).`,
      });
      return;
    }

    // 5. Check if check-in for this local date already exists
    const existingCheckIn = await prisma.checkIn.findUnique({
      where: {
        habitId_localDate: {
          habitId: id,
          localDate: targetLocalDate,
        },
      },
    });

    if (existingCheckIn) {
      res.status(409).json({
        error: `Already checked in for local date ${targetLocalDate}`,
        localDate: targetLocalDate,
      });
      return;
    }

    // 6. Create Check-in record
    const checkIn = await prisma.checkIn.create({
      data: {
        habitId: id,
        utcTimestamp,
        localDate: targetLocalDate,
      },
    });

    // 7. Re-fetch all check-ins to compute updated streaks
    const allCheckIns = await prisma.checkIn.findMany({
      where: { habitId: id },
      select: { localDate: true },
    });

    const localDates = allCheckIns.map((c) => c.localDate);
    const updatedStreaks = calculateStreaks(localDates, userTimezone);

    res.status(201).json({
      message: `Check-in recorded for local date ${targetLocalDate}`,
      checkIn,
      streaks: updatedStreaks,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Unique constraint fail-safe
      res.status(409).json({
        error: 'Duplicate check-in detected at database level for this local date',
      });
      return;
    }
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// DELETE /api/habits/:id - Delete a habit
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      res.status(404).json({ error: 'Habit not found or access denied' });
      return;
    }

    await prisma.habit.delete({ where: { id } });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete habit' });
  }
});

export default router;
