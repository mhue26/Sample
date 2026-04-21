# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run seed         # Seed database with demo data (prisma/seed.ts)
npm run backfill:ledger  # Backfill LedgerEntry from existing Payments/Meetings

npx prisma migrate deploy   # Apply pending migrations
npx prisma db push          # Push schema changes without migration
npx prisma generate         # Regenerate Prisma Client after schema changes
npx prisma studio           # Browse database
```

## Architecture

TutorTools is a multi-tenant SaaS for private tutors covering student management, scheduling, billing, and (planned) AI admin automation. It targets deployment at `app.summitedu.com.au`.

**Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, Prisma 6 + PostgreSQL, NextAuth 4 (Google OAuth + Credentials), Resend (email), Stripe (billing, deferred), ECharts (charts).

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/api/` | REST API routes, one directory per resource |
| `src/app/dashboard/` | Main dashboard with analytics cards |
| `src/app/students/` | Student management |
| `src/app/calendar/` | Scheduling and lesson calendar |
| `src/app/billing/` | Invoicing, payments, ledger |
| `src/app/classes/` | Group class management |
| `src/app/settings/` | Org and user settings |
| `src/app/components/` | Shared UI (layout, charts, dashboard widgets) |
| `src/lib/` | Core logic: `prisma.ts`, `ledger.ts`, `billing.ts` |
| `src/utils/` | Auth helpers, teaching period utilities |
| `prisma/` | Schema, migrations, seed |

### Page / component pattern

Pages are **async server components** that query Prisma directly after calling `requireOrgContext()`. They pass data down to a paired **Client component** (e.g., `StudentsPage` → `StudentsClient.tsx`) that owns all interactivity. Mutations go through API routes fetched from client components; `router.refresh()` re-syncs server data after mutations.

### API route conventions

- Collection routes: `src/app/api/[resource]/route.ts` (GET, POST)
- Item routes: `src/app/api/[resource]/[id]/route.ts` (PATCH, DELETE)
- All routes call `requireOrgContext()` first to get the authenticated user and their active organisation.
- Return `NextResponse.json({ error }, { status })` for errors; `NextResponse.json(data)` for success.

### Auth & multi-tenancy

Auth is handled by NextAuth with a JWT session strategy (`src/utils/auth.ts`). `src/middleware.ts` protects all app routes and redirects unauthenticated users to `/signin`. Each user has at least one Organisation (personal workspace auto-created on first login). `requireOrgContext()` resolves the active org from the session.

### Billing & ledger

Rate resolution follows a hierarchy: meeting-level override → student rate → class default → org billing settings default. `src/lib/ledger.ts` centralises charge computation (`computeLessonChargeCents`) and ledger entry creation. `LedgerEntry` rows represent charges, payments, and adjustments; they are the source of truth for balance calculations.

### Prisma client

The generated client lives at `src/generated/prisma` (not the default location). Always import from there or via `src/lib/prisma.ts` which exports the singleton.

## Required environment variables

```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # JWT signing secret
NEXTAUTH_URL          # App base URL (http://localhost:3000 for dev)
GOOGLE_CLIENT_ID      # OAuth app client ID
GOOGLE_CLIENT_SECRET  # OAuth app client secret
```
