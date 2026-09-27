/**
 * ============================================================
 *  Habit Tracker — Pure Logic Benchmark Suite
 * ============================================================
 *
 *  What this measures (no server / DB required):
 *
 *  1. getLocalDateString()   — UTC → local-day conversion via Luxon
 *  2. calculateStreaks()      — streak engine across varying dataset sizes
 *  3. diffInDays()           — calendar-day diff utility
 *  4. isValidTimezone()      — IANA timezone validation
 *  5. Duplicate-rejection simulation — mimics the 409 guard logic
 *
 *  How to run:
 *    cd server
 *    npx tsx src/utils/benchmark.ts
 *
 *  Results are written to: benchmark-results.json (project root)
 * ============================================================
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getLocalDateString,
  getTodayLocalDateString,
  diffInDays,
  isValidTimezone,
} from './timezone.js';
import { calculateStreaks } from './streakCalculator.js';

// ─── Helpers ────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** High-resolution timer in milliseconds */
function hrMs(): number {
  const [s, ns] = process.hrtime();
  return s * 1_000 + ns / 1_000_000;
}

/** Generate N consecutive local-date strings starting from startDate */
function generateDates(startDate: string, n: number): string[] {
  const dates: string[] = [];
  const [y, m, d] = startDate.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  for (let i = 0; i < n; i++) {
    const day = new Date(base);
    day.setUTCDate(base.getUTCDate() + i);
    dates.push(day.toISOString().split('T')[0]);
  }
  return dates;
}

interface BenchmarkEntry {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
  p95Ms: number;
  notes?: string;
}

/** Run a benchmark and collect timing samples */
function bench(
  name: string,
  iterations: number,
  fn: () => void,
  notes?: string
): BenchmarkEntry {
  // warm-up
  for (let i = 0; i < Math.min(50, iterations / 10); i++) fn();

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = hrMs();
    fn();
    samples.push(hrMs() - t0);
  }

  samples.sort((a, b) => a - b);
  const total = samples.reduce((a, b) => a + b, 0);
  const avg = total / iterations;
  const p95 = samples[Math.floor(iterations * 0.95)] ?? samples[samples.length - 1];

  const entry: BenchmarkEntry = {
    name,
    iterations,
    totalMs: parseFloat(total.toFixed(4)),
    avgMs: parseFloat(avg.toFixed(6)),
    minMs: parseFloat(samples[0].toFixed(6)),
    maxMs: parseFloat(samples[samples.length - 1].toFixed(6)),
    opsPerSec: parseFloat((1_000 / avg).toFixed(2)),
    p95Ms: parseFloat(p95.toFixed(6)),
    ...(notes ? { notes } : {}),
  };

  const bar = '█'.repeat(Math.min(Math.round(avg * 500), 40));
  console.log(`\n  ✅  ${name}`);
  console.log(`       Iterations : ${iterations.toLocaleString()}`);
  console.log(`       Avg        : ${entry.avgMs} ms   ${bar}`);
  console.log(`       Min/Max    : ${entry.minMs} ms / ${entry.maxMs} ms`);
  console.log(`       p95        : ${entry.p95Ms} ms`);
  console.log(`       Ops/sec    : ${entry.opsPerSec.toLocaleString()}`);
  if (notes) console.log(`       Note       : ${notes}`);

  return entry;
}

// ─── Main ───────────────────────────────────────────────────

const TIMEZONE = 'Asia/Kolkata';
const ITERATIONS = 10_000;
const results: BenchmarkEntry[] = [];

console.log('');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║       Habit Tracker — Logic Benchmark Suite          ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`  Timezone  : ${TIMEZONE}`);
console.log(`  Timestamp : ${new Date().toISOString()}`);
console.log(`  Node      : ${process.version}`);
console.log(`  Platform  : ${process.platform} / ${process.arch}`);
console.log('');
console.log('─────────────────────────────────────────────────────────');
console.log('  Section 1 · Timezone Utilities');
console.log('─────────────────────────────────────────────────────────');

// 1a. getLocalDateString — UTC string → local date
results.push(
  bench(
    'getLocalDateString (UTC string → local date)',
    ITERATIONS,
    () => getLocalDateString('2026-03-11T21:30:00Z', TIMEZONE),
    'Simulates converting a check-in UTC timestamp to local calendar date'
  )
);

// 1b. getLocalDateString — Date object → local date
const nowDate = new Date();
results.push(
  bench(
    'getLocalDateString (Date object → local date)',
    ITERATIONS,
    () => getLocalDateString(nowDate, TIMEZONE),
    'Simulates real-time check-in (Date object path)'
  )
);

// 1c. getTodayLocalDateString
results.push(
  bench(
    'getTodayLocalDateString',
    ITERATIONS,
    () => getTodayLocalDateString(TIMEZONE),
    "Called on every check-in to resolve 'today' in the user's timezone"
  )
);

// 1d. diffInDays — consecutive
results.push(
  bench(
    'diffInDays (consecutive days)',
    ITERATIONS,
    () => diffInDays('2026-03-10', '2026-03-11'),
    'Core diff used inside the streak loop'
  )
);

// 1e. diffInDays — cross-month
results.push(
  bench(
    'diffInDays (cross-month boundary)',
    ITERATIONS,
    () => diffInDays('2026-01-28', '2026-02-03'),
    'Verifies cross-month boundaries are handled correctly'
  )
);

// 1f. isValidTimezone — valid
results.push(
  bench(
    'isValidTimezone (valid IANA zone)',
    ITERATIONS,
    () => isValidTimezone('America/New_York'),
    'Runs on every auth-guarded request to validate user timezone'
  )
);

// 1g. isValidTimezone — invalid
results.push(
  bench(
    'isValidTimezone (invalid/garbage string)',
    ITERATIONS,
    () => isValidTimezone('Not/AZone'),
    'Worst-case path — unknown zone'
  )
);

console.log('');
console.log('─────────────────────────────────────────────────────────');
console.log('  Section 2 · Streak Calculator — Varying Dataset Sizes');
console.log('─────────────────────────────────────────────────────────');

const startDate = '2020-01-01';

// Iteration counts tuned to actual timings so total run < 60s
const streakBenchConfigs: Array<[number, number]> = [
  [10,   10_000],
  [50,   10_000],
  [100,  10_000],
  [365,    200],
  [730,    100],
  [1000,    50],
];

for (const [n, iters] of streakBenchConfigs) {
  const dates = generateDates(startDate, n);
  const refDate = dates[dates.length - 1];

  results.push(
    bench(
      `calculateStreaks (${n} consecutive days)`,
      iters,
      () => calculateStreaks(dates, TIMEZONE, refDate),
      `${n}-day full-consecutive streak, referenceToday = last date`
    )
  );
}

console.log('');
console.log('─────────────────────────────────────────────────────────');
console.log('  Section 3 · Streak Calculator — Sparse/Gapped Datasets');
console.log('─────────────────────────────────────────────────────────');

function generateSparseDates(n: number): string[] {
  const all = generateDates('2022-01-01', n * 3);
  return all.filter((_, i) => i % 3 === 0).slice(0, n);
}

const sparseBenchConfigs: Array<[number, number]> = [
  [50,   10_000],
  [200,   2_000],
  [500,     500],
];

for (const [n, iters] of sparseBenchConfigs) {
  const dates = generateSparseDates(n);
  const refDate = dates[dates.length - 1];

  results.push(
    bench(
      `calculateStreaks (${n} sparse/gapped dates)`,
      iters,
      () => calculateStreaks(dates, TIMEZONE, refDate),
      'Every 3rd day only — lots of streak resets, worst-case for loop'
    )
  );
}

console.log('');
console.log('─────────────────────────────────────────────────────────');
console.log('  Section 4 · Duplicate Check-In Guard Simulation');
console.log('─────────────────────────────────────────────────────────');

const checkInSet = new Set(generateDates('2024-01-01', 500));
const existingDate = '2024-06-15';
const newDate = '2024-12-31';

results.push(
  bench(
    'Duplicate guard — Set.has() on existing date (409 path)',
    ITERATIONS,
    () => checkInSet.has(existingDate),
    'Simulates the duplicate detection that triggers HTTP 409'
  )
);

results.push(
  bench(
    'Duplicate guard — Set.has() on new date (201 path)',
    ITERATIONS,
    () => checkInSet.has(newDate),
    'Simulates the happy-path new check-in lookup'
  )
);

console.log('');
console.log('─────────────────────────────────────────────────────────');
console.log('  Section 5 · End-to-End Worked Example (Full Pipeline)');
console.log('─────────────────────────────────────────────────────────');

results.push(
  bench(
    'Full check-in pipeline (UTC→localDate + streak calc, 30-day history)',
    ITERATIONS,
    () => {
      const localDate = getLocalDateString('2026-03-11T21:30:00Z', TIMEZONE);
      const history = generateDates('2026-02-09', 30);
      if (!history.includes(localDate)) history.push(localDate);
      calculateStreaks(history, TIMEZONE, localDate);
    },
    'Combines timezone conversion + streak recalculation as done on each check-in'
  )
);

// ─── Summary Table ───────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                          BENCHMARK SUMMARY TABLE                               ║');
console.log('╠══════════════════════════════════════════════════════════════════════════════════╣');
console.log(
  `║  ${'Benchmark'.padEnd(50)} ${'Avg (ms)'.padStart(10)} ${'Ops/sec'.padStart(12)} ║`
);
console.log('╠══════════════════════════════════════════════════════════════════════════════════╣');
for (const r of results) {
  const label = r.name.length > 50 ? r.name.slice(0, 47) + '...' : r.name;
  console.log(
    `║  ${label.padEnd(50)} ${String(r.avgMs).padStart(10)} ${String(r.opsPerSec.toLocaleString()).padStart(12)} ║`
  );
}
console.log('╚══════════════════════════════════════════════════════════════════════════════════╝');

// ─── Save Results ────────────────────────────────────────────

const output = {
  meta: {
    runAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    timezone: TIMEZONE,
    defaultIterations: ITERATIONS,
  },
  benchmarks: results,
};

// Save alongside the project root
const outPath = join(__dirname, '../../../../benchmark-results.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

console.log('');
console.log(`  💾  Results saved → benchmark-results.json (project root)`);
console.log('');
