# Dev Growth Tracker

A personal dashboard to track daily tasks, learnings, skill growth, and wins
across multiple projects, with dynamic custom fields and a configurable chart
dashboard.

## Stack

React + Vite + TypeScript, TanStack Query, Zustand (UI state only), Tailwind
CSS, recharts, Supabase (Postgres + Auth + RLS), SheetJS for `.xlsx` export.

## Setup

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

The Supabase anon key is safe to expose client-side. The `service_role` key
must never appear in this app — privileged operations belong in Supabase Edge
Functions only.

## Database

All tables have Row Level Security enabled, scoped to `auth.uid()`. Schema
and RLS policies are applied via Supabase migrations (see the Supabase
project's migration history) rather than checked into this repo.

Dashboard chart aggregation (group-by, sum/avg/count over fixed columns or
`custom_fields` JSONB keys) runs server-side via the `aggregate_tasks`
Postgres function, called through `supabase.rpc()`. It validates field names
and the aggregation function against allow-lists before building any dynamic
SQL, and explicitly filters by `user_id = auth.uid()` since it runs as
`security definer`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build for production
- `npm run lint` — run Oxlint
