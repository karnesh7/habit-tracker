import { DateTime, IANAZone } from 'luxon';

/**
 * Validates whether a given string is a valid IANA timezone identifier (e.g., 'Asia/Kolkata').
 */
export function isValidTimezone(zone: string): boolean {
  if (!zone || typeof zone !== 'string') return false;
  return IANAZone.isValidZone(zone);
}

/**
 * Converts a UTC instant (Date or ISO string) into the local date string ('YYYY-MM-DD')
 * according to the user's specified IANA timezone.
 */
export function getLocalDateString(utcDate: Date | string, timezone: string): string {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const dt = DateTime.fromJSDate(dateObj, { zone: 'utc' }).setZone(timezone);
  const isoDate = dt.toISODate();
  if (!isoDate) {
    throw new Error(`Invalid date conversion for timestamp ${utcDate} in zone ${timezone}`);
  }
  return isoDate;
}

/**
 * Returns today's calendar date string ('YYYY-MM-DD') in the user's local timezone.
 */
export function getTodayLocalDateString(timezone: string): string {
  const dt = DateTime.now().setZone(timezone);
  return dt.toISODate()!;
}

/**
 * Returns yesterday's calendar date string ('YYYY-MM-DD') in the user's local timezone.
 */
export function getYesterdayLocalDateString(timezone: string): string {
  const dt = DateTime.now().setZone(timezone).minus({ days: 1 });
  return dt.toISODate()!;
}

/**
 * Checks if a given local date string ('YYYY-MM-DD') is in the user's local future.
 */
export function isFutureLocalDate(targetLocalDate: string, timezone: string): boolean {
  const todayLocal = getTodayLocalDateString(timezone);
  return targetLocalDate > todayLocal;
}

/**
 * Checks if a given local date string ('YYYY-MM-DD') is before the habit's creation local date.
 */
export function isBeforeHabitCreationDate(
  targetLocalDate: string,
  habitCreatedAt: Date,
  timezone: string
): boolean {
  const creationLocalDate = getLocalDateString(habitCreatedAt, timezone);
  return targetLocalDate < creationLocalDate;
}

/**
 * Computes difference in calendar days between two 'YYYY-MM-DD' dates (date2 - date1).
 */
export function diffInDays(localDate1: string, localDate2: string): number {
  const dt1 = DateTime.fromISO(localDate1, { zone: 'utc' });
  const dt2 = DateTime.fromISO(localDate2, { zone: 'utc' });
  return Math.round(dt2.diff(dt1, 'days').days);
}
