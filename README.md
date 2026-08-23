# Timezone-Aware Habit Tracker with Streaks

A fullstack Habit Tracker application engineered to demonstrate production-grade **timezone-aware local-day check-in enforcement** and **server-side streak calculation**.

---

## 🌟 Key Features

1. **Strict Local-Day Rule**: A streak is measured in the user's own local calendar day (e.g. `Asia/Kolkata`), not in 24-hour elapsed windows.
2. **Database-Level Enforcement**: Uses a compound unique constraint `@@unique([habitId, localDate])` in Prisma (SQLite / MySQL) to guarantee at the storage layer that only one check-in per local day per habit can ever be written.
3. **Server-Side Streaks**: `currentStreak` and `longestStreak` are computed exclusively on the server. The client never determines streak state.
4. **Backfilling Support**: Users can log past local dates. Backfilling automatically re-evaluates streak calculations.
5. **Modern Glassmorphic UI**: React 19 SPA with Tailwind CSS, Lucide icons, streak flame indicators, and interactive timezone notice banners.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Luxon (timezone conversions), Zod (input validation), JWT Auth, bcryptjs, Vitest.
- **Frontend**: Vite, React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Database**: SQLite (zero-config local dev) / MySQL.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Installation
From the root directory, install all dependencies:
```bash
# Install root, server, and client dependencies
npm run install:all
```

Or install individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Database Initialization
```bash
cd server
npx prisma db push
```

### 4. Running Dev Servers
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

The backend test suite includes Vitest tests validating local-day timezone conversions and the exact Worked Example (Check-ins A, B, C, D) from the assignment specifications.

```bash
cd server
npm run test
```
