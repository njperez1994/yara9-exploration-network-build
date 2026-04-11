# Macana Supabase Vercel Guide

## Purpose

This document captures the current live Supabase setup for Macana Commerce Center and the exact frontend environment needed to test the Vercel deployment against the real database.

## Current Status

The following path has already been validated against the remote Supabase project:

1. `get_state`
2. `claim_t1_probe`
3. `start_scan`
4. wait for scan completion
5. `get_state` returns a pending `data_item`
6. `redeem_data_item`

This loop is handled by the `macana-loop` Supabase Edge Function and persists state in the live database.

## Runtime Architecture

Frontend:

- uses `VITE_SUPABASE_URL`
- uses the legacy Supabase `anon` JWT key in `VITE_SUPABASE_ANON_K` or `VITE_SUPABASE_ANON_KEY`
- invokes `macana-loop` through `supabase.functions.invoke(...)`
- never receives `service_role` or direct database credentials

Backend:

- `macana-loop` runs inside Supabase Edge Functions
- uses Supabase reserved runtime variables such as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- uses custom secrets such as `OWNER_WALLET`, `APP_ENV`, and `MACANA_LOOP_MODE`

## Important Key Choice

`macana-loop` is currently deployed with JWT verification enabled.

That means the frontend should use the legacy `anon` JWT key for now, not the newer `sb_publishable_*` key, because the app does not yet establish Supabase Auth user sessions.

Use:

- `VITE_SUPABASE_URL=https://qnwycqqdhzruyykajwpk.supabase.co`
- `VITE_SUPABASE_ANON_K=<legacy anon jwt key>`

or, if your platform allows it:

- `VITE_SUPABASE_ANON_KEY=<legacy anon jwt key>`

Do not use the `service_role` key in Vercel.

## Custom Function Secrets

Do not upload reserved `SUPABASE_*` names with `supabase secrets set`.

Use custom names only, for example:

- `OWNER_WALLET`
- `APP_ENV`
- `MACANA_LOOP_MODE`
- `SB_PUBLISHABLE_KEY`

Example local file:

```env
OWNER_WALLET=
APP_ENV=production
MACANA_LOOP_MODE=live
SB_PUBLISHABLE_KEY=
```

Tracked template:

- `functions.env.example`

Ignored local file:

- `functions.env`

## Local Frontend Configuration

The local Vite app reads frontend Supabase values from:

- `frontend.env`

The file is ignored by Git.

The Vite build also has support for injecting the same values from the Vercel environment.

## Vercel Setup

For the frontend deployment in Vercel, add these environment variables to the Vercel project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_K`

Use the same legacy `anon` JWT key that works locally.

Vercel's warning here is generic. The important distinction is not whether the variable name contains `KEY`, but whether the value is intended to be public. Any `VITE_*` variable is exposed to the browser bundle. That is acceptable for the Supabase public `anon` key, but never for `service_role` or database credentials.

Do not add:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- any secret backend-only credential

## Vercel Smoke Test

After setting the variables in Vercel:

1. trigger a new frontend deployment
2. open the deployed app
3. pass the docking flow
4. open `Data Exchange`
5. claim a T1 probe
6. start a scan
7. wait for the timer to complete
8. redeem the packet
9. confirm standing and pending item counts update correctly

## Remote Schema Compatibility Notes

The live Supabase project currently has a schema that is slightly different from the target local migration.

Current backend compatibility handling includes:

- `scan_events.result` uses enum values such as `common_data`, `rare_data`, and `failed`
- pending scans are tracked via `scan_events.notes = 'scan_pending'`
- `scan_events.target_body_type` currently accepts values compatible with `planet` and `moon`
- `data_items.scan_event_id` may not yet have a unique constraint in the deployed project
- `redemptions` may still expose legacy multiplier columns such as `rarity_base`, `quality_mult`, `tier_mult`, `demand_mult`, and `freshness_mult`

Do not remove this compatibility logic until the remote schema is intentionally consolidated with a migration.

## Recommended Next Step

Run the Vercel binding test first.

After that, the next useful hardening step is rider identity verification so the frontend is not trusted to submit an arbitrary wallet address to `macana-loop`.
