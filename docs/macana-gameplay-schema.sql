-- Macana Commerce Center gameplay simulation schema
-- PostgreSQL-oriented MVP design for the hackathon simulation layer.
-- Text ids are intentional so app ids can later be replaced or augmented
-- with Sui addresses, object ids, or Move-managed references.

create table corporations (
  id text primary key,
  code text not null unique,
  name text not null,
  sui_address text,
  sui_object_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stations (
  id text primary key,
  corporation_id text not null references corporations(id),
  code text not null unique,
  name text not null,
  location_system_id text,
  sui_object_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table riders (
  id text primary key,
  callsign text not null,
  wallet_address text,
  sui_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resource_types (
  id text primary key,
  code text not null unique,
  label text not null,
  eve_type_id text,
  move_type_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table station_resource_balances (
  id text primary key,
  station_id text not null references stations(id),
  resource_type_id text not null references resource_types(id),
  available_units bigint not null default 0,
  reserved_units bigint not null default 0,
  source_snapshot_ref text,
  source_snapshot_at timestamptz,
  source_sui_object_id text,
  updated_at timestamptz not null default now(),
  unique (station_id, resource_type_id)
);

create table item_types (
  id text primary key,
  code text not null unique,
  label text not null,
  category text not null,
  move_package_id text,
  move_module text,
  move_struct text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table crafting_recipes (
  id text primary key,
  station_id text not null references stations(id),
  item_type_id text not null references item_types(id),
  label text not null,
  output_quantity integer not null check (output_quantity > 0),
  craft_duration_seconds integer not null check (craft_duration_seconds > 0),
  active boolean not null default true,
  move_recipe_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crafting_recipe_inputs (
  id text primary key,
  recipe_id text not null references crafting_recipes(id) on delete cascade,
  resource_type_id text not null references resource_types(id),
  quantity bigint not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (recipe_id, resource_type_id)
);

create table corporation_inventory (
  id text primary key,
  corporation_id text not null references corporations(id),
  station_id text not null references stations(id),
  item_type_id text not null references item_types(id),
  quantity bigint not null default 0,
  reserved_quantity bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (corporation_id, station_id, item_type_id)
);

create table corporation_crafting_jobs (
  id text primary key,
  corporation_id text not null references corporations(id),
  station_id text not null references stations(id),
  recipe_id text not null references crafting_recipes(id),
  item_type_id text not null references item_types(id),
  requested_by_rider_id text references riders(id),
  quantity integer not null check (quantity > 0),
  status text not null check (status in ('queued', 'completed', 'cancelled')),
  source_snapshot_ref text,
  source_sui_tx_digest text,
  requested_at timestamptz not null default now(),
  started_at timestamptz not null,
  ready_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table systems (
  id text primary key,
  code text not null unique,
  label text not null,
  security_band text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table scan_targets (
  id text primary key,
  system_id text not null references systems(id),
  code text,
  label text not null,
  target_kind text not null,
  standing_reward integer not null check (standing_reward >= 0),
  mtc_reward numeric(20,4) not null default 0,
  scan_duration_seconds integer not null check (scan_duration_seconds > 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table standing_tiers (
  id text primary key,
  code text not null unique,
  label text not null,
  minimum_standing integer not null,
  daily_t1_withdrawal_limit integer not null check (daily_t1_withdrawal_limit >= 0),
  unlock_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table rider_standing (
  id text primary key,
  rider_id text not null references riders(id),
  corporation_id text not null references corporations(id),
  standing_tier_id text not null references standing_tiers(id),
  total_standing integer not null default 0,
  last_scan_result_id text,
  updated_at timestamptz not null default now(),
  unique (rider_id, corporation_id)
);

create table mtc_wallets (
  id text primary key,
  rider_id text not null references riders(id),
  balance numeric(20,4) not null default 0,
  settlement_address text,
  updated_at timestamptz not null default now(),
  unique (rider_id)
);

create table rider_inventory (
  id text primary key,
  rider_id text not null references riders(id),
  corporation_id text not null references corporations(id),
  station_id text not null references stations(id),
  item_type_id text not null references item_types(id),
  quantity integer not null default 1 check (quantity = 1),
  status text not null check (status in ('ready', 'deployed', 'consumed', 'expired')),
  source_withdrawal_id text,
  source_crafting_job_id text references corporation_crafting_jobs(id),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  chain_object_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table satellite_withdrawals (
  id text primary key,
  rider_id text not null references riders(id),
  corporation_id text not null references corporations(id),
  station_id text not null references stations(id),
  item_type_id text not null references item_types(id),
  rider_inventory_id text not null unique references rider_inventory(id),
  standing_tier_id text not null references standing_tiers(id),
  standing_at_withdrawal integer not null,
  day_key date not null,
  cost_mtc numeric(20,4) not null default 0,
  withdrawn_at timestamptz not null,
  expires_at timestamptz not null,
  source_sui_tx_digest text,
  created_at timestamptz not null default now()
);

create table satellite_deployments (
  id text primary key,
  rider_id text not null references riders(id),
  rider_inventory_id text not null unique references rider_inventory(id),
  target_id text not null references scan_targets(id),
  status text not null check (status in ('active', 'completed', 'failed', 'expired')),
  deployed_at timestamptz not null,
  completes_at timestamptz not null,
  completed_at timestamptz,
  result_snapshot jsonb not null default '{}'::jsonb,
  source_sui_tx_digest text,
  created_at timestamptz not null default now()
);

create table scan_results (
  id text primary key,
  rider_id text not null references riders(id),
  deployment_id text not null unique references satellite_deployments(id),
  target_id text not null references scan_targets(id),
  status text not null check (status in ('captured', 'submitted', 'rejected')),
  data_units integer not null default 1,
  standing_awarded integer not null default 0,
  mtc_awarded numeric(20,4) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null,
  submitted_at timestamptz,
  source_sui_tx_digest text,
  created_at timestamptz not null default now()
);

create table mtc_ledger (
  id text primary key,
  wallet_id text not null references mtc_wallets(id),
  rider_id text not null references riders(id),
  scan_result_id text references scan_results(id),
  amount numeric(20,4) not null,
  direction text not null check (direction in ('credit', 'debit')),
  reason text not null,
  source_sui_tx_digest text,
  created_at timestamptz not null default now()
);

create index idx_station_resource_balances_station on station_resource_balances(station_id);
create index idx_corporation_crafting_jobs_ready on corporation_crafting_jobs(status, ready_at);
create index idx_rider_inventory_ready on rider_inventory(rider_id, status, expires_at);
create index idx_satellite_withdrawals_daily on satellite_withdrawals(rider_id, day_key);
create index idx_satellite_deployments_active on satellite_deployments(rider_id, status, completes_at);
create index idx_scan_results_pending on scan_results(rider_id, status, completed_at);
