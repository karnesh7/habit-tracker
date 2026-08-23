export interface User {
  id: string;
  email: string;
  timezone: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  utcTimestamp: string;
  localDate: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  lastCheckInLocalDate?: string | null;
  totalCheckIns: number;
  checkIns?: CheckIn[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
