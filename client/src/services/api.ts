import { AuthResponse, Habit, User } from '../types.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('habit_tracker_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'An error occurred while processing your request');
  }
  return data as T;
}

export const api = {
  // Auth API
  async signup(payload: { email: string; password: string; timezone: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateTimezone(timezone: string): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/timezone`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ timezone }),
    });
    return handleResponse<{ user: User; token: string }>(res);
  },

  // Habits API
  async getHabits(): Promise<{ habits: Habit[] }> {
    const res = await fetch(`${API_BASE}/habits`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ habits: Habit[] }>(res);
  },

  async getHabitById(id: string): Promise<{ habit: Habit }> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ habit: Habit }>(res);
  },

  async createHabit(payload: { name: string; description?: string }): Promise<{ habit: Habit }> {
    const res = await fetch(`${API_BASE}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ habit: Habit }>(res);
  },

  async checkInHabit(
    id: string,
    payload?: { date?: string; timestamp?: string }
  ): Promise<{ message: string; streaks: { currentStreak: number; longestStreak: number; isCompletedToday: boolean } }> {
    const res = await fetch(`${API_BASE}/habits/${id}/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload || {}),
    });
    return handleResponse(res);
  },

  async deleteHabit(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/habits/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};
