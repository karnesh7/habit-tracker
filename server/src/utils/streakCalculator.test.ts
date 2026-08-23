import { describe, it, expect } from 'vitest';
import { getLocalDateString } from './timezone.js';
import { calculateStreaks } from './streakCalculator.js';

describe('Timezone Local-Day Conversion (Assignment Worked Example)', () => {
  const timezone = 'Asia/Kolkata';

  it('converts UTC timestamps correctly to Asia/Kolkata local dates', () => {
    // Check-in A: 2026-03-10T14:30Z -> local 2026-03-10 20:00
    const localDateA = getLocalDateString('2026-03-10T14:30:00Z', timezone);
    expect(localDateA).toBe('2026-03-10');

    // Check-in B: 2026-03-11T10:30Z -> local 2026-03-11 16:00
    const localDateB = getLocalDateString('2026-03-11T10:30:00Z', timezone);
    expect(localDateB).toBe('2026-03-11');

    // Check-in C: 2026-03-11T21:30Z -> local 2026-03-12 03:00 (11 hours after B, new local day!)
    const localDateC = getLocalDateString('2026-03-11T21:30:00Z', timezone);
    expect(localDateC).toBe('2026-03-12');

    // Check-in D: 2026-03-12T17:30Z -> local 2026-03-12 23:00 (20 hours after C, SAME local day!)
    const localDateD = getLocalDateString('2026-03-12T17:30:00Z', timezone);
    expect(localDateD).toBe('2026-03-12');
  });
});

describe('Streak Calculation Engine', () => {
  const timezone = 'Asia/Kolkata';

  it('calculates streaks correctly for sequential local days (Worked Example A, B, C)', () => {
    const dates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    const result = calculateStreaks(dates, timezone, '2026-03-12');

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.isCompletedToday).toBe(true);
  });

  it('keeps streak alive on day after last check-in if today is not completed yet', () => {
    const dates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    // On 2026-03-13 (today), user has not checked in yet, but yesterday (2026-03-12) is logged
    const result = calculateStreaks(dates, timezone, '2026-03-13');

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.isCompletedToday).toBe(false);
  });

  it('resets current streak to 0 if a day is missed', () => {
    const dates = ['2026-03-10', '2026-03-11', '2026-03-12'];
    // On 2026-03-14, neither today (14) nor yesterday (13) was logged
    const result = calculateStreaks(dates, timezone, '2026-03-14');

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
    expect(result.isCompletedToday).toBe(false);
  });

  it('re-calculates current and longest streak correctly when backfilling a past date', () => {
    // User had streak of 3 ('2026-03-10', '2026-03-11', '2026-03-12')
    // Missed 2026-03-13. Today is 2026-03-14.
    // User backfills 2026-03-13!
    const backfilledDates = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13'];
    const result = calculateStreaks(backfilledDates, timezone, '2026-03-14');

    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });
});
