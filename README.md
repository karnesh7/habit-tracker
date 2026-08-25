# Timezone-Aware Habit Tracker with Streaks

A fullstack Habit Tracker application engineered to demonstrate production-grade **timezone-aware local-day check-in enforcement**, **server-side streak calculation**, and **containerized deployment**.

---

## 🗓️ How Local Days Are Modeled

### The Core Challenge
The single most critical requirement of this application is: **a streak is measured in the user's own local calendar day, not in 24-hour elapsed windows.**

Two check-ins 20 hours apart can mean two completely different outcomes depending on the user's IANA timezone (e.g. `Asia/Kolkata`):
- **20 hours apart across midnight** (e.g. March 10 at 20:00 local time and March 11 at 16:00 local time) → **Two different local days** → **Streak increments to 2**.
- **20 hours apart within the same calendar day** (e.g. March 12 at 03:00 local time and March 12 at 23:00 local time) → **Same local day** → **Duplicate check-in, rejected!**

### 1. Data Modeling Architecture
Every check-in record stores two distinct pieces of temporal data:
1. **`utcTimestamp` (`DateTime`)**: The exact instant in UTC when the check-in occurred.
2. **`localDate` (`String` - `YYYY-MM-DD`)**: The calendar date string computed by converting `utcTimestamp` into the user's local IANA timezone (`Asia/Kolkata`, `America/New_York`, `Europe/London`) via Luxon (`DateTime.fromJSDate(utcDate).setZone(timezone).toISODate()`).

### 2. Database-Level Unique Enforcement
To guarantee atomicity and prevent race conditions (e.g. two check-in HTTP requests hitting the server at the exact same millisecond), enforcement is handled at the database storage engine layer via Prisma:

```prisma
model CheckIn {
  id           String   @id @default(uuid())
  habitId      String
  habit        Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
  utcTimestamp DateTime
  localDate    String   // Local calendar day string: "YYYY-MM-DD"
  createdAt    DateTime @default(now())

  // Database-level enforcement of one check-in per local day per habit
  @@unique([habitId, localDate])
}
```

If a duplicate check-in is attempted for the same local date, the database B-Tree index rejects the write and triggers constraint error `P2002`, returning a clean HTTP `409 Conflict` to the client.

### 3. Server-Side Streak Algorithm
Streaks are computed exclusively on the server (`server/src/utils/streakCalculator.ts`):
- **`currentStreak`**: Counts consecutive calendar days ending **today** (or **yesterday** if today hasn't been logged yet). If neither today nor yesterday is logged, `currentStreak = 0`.
- **`longestStreak`**: Maximum consecutive sequence of local days across all historical check-ins.
- **Backfilling**: When a user logs a past local date, the check-in is saved, and `calculateStreaks()` re-evaluates all sorted dates chronologically, updating current & longest streaks seamlessly.

### 4. Worked Example (`Asia/Kolkata`, UTC+05:30)
- **Check-in A**: `2026-03-10T14:30Z` → local `2026-03-10 20:00` → **Local Date: `2026-03-10`** (Streak = 1)
- **Check-in B**: `2026-03-11T10:30Z` → local `2026-03-11 16:00` → **Local Date: `2026-03-11`** (20h apart, new local day → Streak = 2)
- **Check-in C**: `2026-03-11T21:30Z` → local `2026-03-12 03:00` → **Local Date: `2026-03-12`** (11h apart, new local day → Streak = 3)
- **Check-in D**: `2026-03-12T17:30Z` → local `2026-03-12 23:00` → **Local Date: `2026-03-12`** (20h apart, SAME local day → Duplicate, rejected!)

---

## 🌟 Key Features

1. **Strict Local-Day Rule**: Measured in local calendar days in the user's IANA timezone.
2. **Database-Level Enforcement**: Storage engine index `@@unique([habitId, localDate])`.
3. **Server-Side Streaks**: `currentStreak` and `longestStreak` computed strictly on the server.
4. **Backfilling Support**: Past local date logging with dynamic streak re-evaluation.
5. **Modern Glassmorphic UI**: React 19 SPA with Tailwind CSS, Lucide icons, streak badges, and toast feedback.
6. **Docker Containerization**: Multi-container Docker Compose setup for instant deployment.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Luxon (timezones), Zod (validation), JWT Auth, bcryptjs, Vitest.
- **Frontend**: Vite, React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Database**: SQLite (zero-config local dev) / MySQL.
- **Containerization**: Docker, Docker Compose (`node:20-alpine`).

---

## 🚀 Setup & Execution Instructions

### Option A: Running with Docker Compose (Recommended)

Run the entire fullstack application (Backend API on port `5000` + Frontend SPA on port `3000`) with one command:

```bash
docker compose up --build
```

- **Frontend UI**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`

---

### Option B: Running Locally with Node.js & npm

#### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

#### 2. Installation
From the root directory, install all dependencies:
```bash
npm run install:all
```

#### 3. Database Initialization
```bash
cd server
npx prisma db push
```

#### 4. Running Development Servers
To run backend REST API (runs on `http://localhost:5000`):
```bash
npm run dev:server
```

To run frontend SPA (runs on `http://localhost:3000`):
```bash
npm run dev:client
```

---

## 🧪 Running Unit Tests

The backend test suite includes Vitest unit tests validating local-day timezone conversions and the exact Worked Example sequence (Check-ins A, B, C, D) from the assignment specifications.

```bash
cd server
npm run test
```
