import { diffInDays, getTodayLocalDateString, getYesterdayLocalDateString } from './timezone.js';

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
  lastCheckInLocalDate: string | null;
}

/**
 * Pure function to calculate current and longest streaks from an array of local dates ('YYYY-MM-DD').
 *
 * @param checkInLocalDates List of local dates ('YYYY-MM-DD') recorded for the habit.
 * @param userTimezone The user's IANA timezone (e.g. 'Asia/Kolkata').
 * @param referenceToday Optional reference date for today ('YYYY-MM-DD') for deterministic testing.
 */
export function calculateStreaks(
  checkInLocalDates: string[],
  userTimezone: string,
  referenceToday?: string
): StreakResult {
  const today = referenceToday || getTodayLocalDateString(userTimezone);
  const yesterday = referenceToday
    ? getYesterdayFromReference(referenceToday)
    : getYesterdayLocalDateString(userTimezone);

  if (!checkInLocalDates || checkInLocalDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isCompletedToday: false,
      lastCheckInLocalDate: null,
    };
  }

  // Deduplicate and sort local dates in ascending order ('YYYY-MM-DD' string comparison works chronologically)
  const sortedDates = Array.from(new Set(checkInLocalDates)).sort();
  const dateSet = new Set(sortedDates);

  const isCompletedToday = dateSet.has(today);
  const lastCheckInLocalDate = sortedDates[sortedDates.length - 1];

  // 1. Calculate Longest Streak
  let longestStreak = 0;
  let currentRun = 0;

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentRun = 1;
    } else {
      const daysBetween = diffInDays(sortedDates[i - 1], sortedDates[i]);
      if (daysBetween === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // 2. Calculate Current Streak
  // Streak is alive ONLY IF either today or yesterday has a check-in.
  let currentStreak = 0;

  if (dateSet.has(today) || dateSet.has(yesterday)) {
    // Start counting backwards from whichever anchor date is present (today or yesterday)
    let anchor = dateSet.has(today) ? today : yesterday;
    currentStreak = 1;

    let cursor = anchor;
    while (true) {
      const prevDay = getYesterdayFromReference(cursor);
      if (dateSet.has(prevDay)) {
        currentStreak++;
        cursor = prevDay;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    isCompletedToday,
    lastCheckInLocalDate,
  };
}

function getYesterdayFromReference(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('T')[0];
}
