# DB_RULES

## Purpose

This file defines the database contract for the EVE Frontier Macana Corp MVP running on Supabase.
It is the source of truth for how the database is organized, which tables exist, what they represent, and which parts of the logic belong in backend code instead of the frontend.

## Core Principles

- Keep the schema simple.
- Persist gameplay data needed for the UI loop.
- Separate scan execution from redeemable items and payouts.
- Keep security-sensitive logic in the backend.
- Do not use service role keys in the frontend.

## Current Deployment Notes

These notes reflect the currently deployed Supabase project used by the hackathon build.

- `macana-loop` is deployed as a Supabase Edge Function with JWT verification enabled.
- Because the app does not yet use Supabase Auth user sessions, the frontend currently invokes the function with the legacy `anon` JWT key, not the newer `sb_publishable_*` key.
- Custom function secrets must use project-specific names such as `OWNER_WALLET`, `APP_ENV`, `MACANA_LOOP_MODE`, or `SB_PUBLISHABLE_KEY`.
- Do not upload reserved `SUPABASE_*` names with `supabase secrets set`.
- The currently deployed `scan_events.result` field is enum-backed and accepts values like `common_data`, `rare_data`, and `failed`.
- The backend currently tracks pending scans through `scan_events.notes = 'scan_pending'` and finalized scans through `scan_events.notes = 'scan_finalized'`.
- The currently deployed `scan_events.target_body_type` field is enum-backed and presently uses values compatible with `planet` and `moon`.
- The currently deployed `data_items` table may not have a unique constraint on `scan_event_id`, so backend code must check for an existing item before inserting.
- The currently deployed `redemptions` table may expose legacy multiplier field names such as `rarity_base`, `quality_mult`, `tier_mult`, `demand_mult`, and `freshness_mult`; backend code must remain compatible until the schema is consolidated.

## Current Roles

- `normal`
- `owner`

Notes:

- `owner` is also a rider.
- For now, the backend decides which wallet is the owner wallet.
- Only `owner` can access T1 crafting.

## Main Gameplay Loop

1. Rider has wallet, role, standing points, licenses, and MTC balance.
2. Rider consumes T1/T2 probes.
3. A scan is recorded as a `scan_event`.
4. If successful, the scan creates a `data_item`.
5. A `redemption` validates the `data_item`.
6. If accepted, the rider receives MTC and standing points.
7. T3 satellites are persistent rider-owned units that can generate data over time.

## Tables

### `mcc`

Represents Macana Commerce Center treasury and global balances.

Key fields:

- `id`
- `name`
- `lux_balance`
- `mtc_treasury_balance`
- timestamps

### `riders`

Represents players connected to the MCC.

Key fields:

- `id`
- `mcc_id`
- `rider_name`
- `wallet_address`
- `role` (`normal` or `owner`)
- `standing_points`
- `mtc_balance`
- `total_scan_points`
- timestamps

Rules:

- Wallet must be unique.
- Owner is stored here too.

### `rider_licenses`

Stores T1, T2, and T3 access.

Key fields:

- `id`
- `rider_id`
- `tier` (`T1`, `T2`, `T3`)
- `status`
- `issued_at`
- `expires_at`
- `notes`

Rules:

- Usually only one active license per rider and tier.

### `rider_probe_inventory`

Stores consumable T1 and T2 probes.

Key fields:

- `id`
- `rider_id`
- `probe_tier` (`T1`, `T2`)
- `quantity`
- timestamps

Rules:

- T1/T2 are not persistent satellites.
- Inventory quantity must not go below zero.

### `scan_events`

Stores the raw execution of a scan.

Key fields:

- `id`
- `rider_id`
- `probe_tier`
- `source_target_id`
- `target_body_type`
- `scan_duration_seconds`
- `interruption_flag`
- `random_variance`
- `result`
- `quality_score`
- `raw_signal_strength`
- `notes`
- `created_at`

Rules:

- This table is the scan log.
- Failed scans do not create payout by themselves.

### `data_items`

Stores redeemable data generated from successful scans.

Key fields:

- `id`
- `scan_event_id`
- `owner_rider_id`
- `source_target_id`
- `rarity`
- `quality_score`
- `item_integrity`
- `target_valid`
- `metadata` (jsonb)
- `minted_from_scan_at`
- `created_at`

Rules:

- A `data_item` should come from a successful `scan_event`.
- Manual inserts are allowed for testing if needed.

### `daily_mtc_budgets`

Stores daily MTC emission budgets.

Key fields:

- `id`
- `mcc_id`
- `budget_date`
- `net_lux_performance`
- `mint_budget_mtc`
- `policy_name`
- `policy_snapshot` (jsonb)
- `total_accepted_reward_points`
- timestamps

Rules:

- One budget per MCC per day.
- Budget is linked to treasury policy and LUX performance.

### `redemptions`

Stores validation and payout results for `data_items`.

Key fields:

- `id`
- `data_item_id`
- `rider_id`
- `budget_id`
- `status`
- validation booleans
- `duplicate_rank`
- `duplicate_penalty`
- reward multiplier fields
- `reward_points`
- `mtc_reward`
- `standing_points_awarded`
- `rejection_reason`
- `processed_at`
- `created_at`

Rules:

- Each `data_item` should be redeemed at most once.
- Successful redemptions grant MTC and standing.
- Failed scans grant no standing.

### `persistent_satellites`

Stores T3 persistent satellites.

Key fields:

- `id`
- `rider_id`
- `satellite_name`
- `status`
- `source_target_id`
- `visible_to_radar`
- coordinates
- `deployed_at`
- `last_generated_at`
- `destroyed_at`
- timestamps

Rules:

- T3 belongs to the rider, not MCC.
- T3 is persistent and may generate data over time.
- T3 should be visible to radar for future attack mechanics.

### `rider_daily_t1_quota`

Stores the current daily public T1 quota state.

Key fields:

- `id`
- `rider_id`
- `quota_date`
- `quota_limit`
- `quota_used`
- timestamps

Rules:

- Used to emulate the 24h quota refresh.
- Backend can compute quota from standing rules.

## Standing Rules

- Standing is stored as `standing_points`.
- Frontend can derive standing tiers later.
- Prototype quotas:
    - low: 5
    - medium: 10
    - high: 15

- Successful redemption grants standing.
- Failed scan grants no standing.

## Reward Model

Conceptual formula:

`RewardPoints = RarityBase * QualityMult * TierMult * DemandMult * FreshnessMult * DupPenalty`

`MTCReward = (RewardPoints / TotalAcceptedPointsForPeriod) * DailyMTCMintBudget`

Notes:

- Final calculation is backend logic for now.
- Store the resolved multipliers and payout in `redemptions`.

## Duplicate Window Logic

Example behavior for similar items in the same target/window:

- first valid item: 100%
- second: 60%
- third and later: 30%

Store the applied result in:

- `duplicate_rank`
- `duplicate_penalty`

## Access Control Rules

- Frontend must only use the public/anon key.
- Backend may use service role for privileged operations.
- Never expose service role keys in the browser.
- T1 crafting is backend-gated to `owner` only.
- Keep `macana-loop` on verified JWT mode unless there is a deliberate public webhook use case.

## Backend Responsibilities

The backend should own:

- owner wallet validation
- role-sensitive actions
- T1 crafting permission checks
- standing tier derivation if needed
- duplicate window evaluation
- reward calculation
- payout processing
- T3 timed generation logic
- future radar/attack mechanics
- compatibility with the currently deployed Supabase enum and multiplier field names until a cleanup migration is applied

## Frontend Responsibilities

The frontend should:

- read rider/profile/dashboard data
- show probe inventory
- show scan history
- show data items
- show redemption history
- show T3 persistent satellites
- never calculate authoritative rewards or permissions on its own
- use `VITE_SUPABASE_URL` plus the legacy `anon` JWT key while function JWT verification remains enabled and Supabase Auth is not yet wired into the app

## Agent Instructions

When modifying the app:

- preserve table names and relations unless a migration is explicitly planned
- prefer additive migrations over destructive changes
- do not put secret keys in frontend code
- do not bypass backend checks for owner-only actions
- treat `DB_RULES.md` as the primary contract for database behavior
- if schema changes are needed, update this file and create a migration script
