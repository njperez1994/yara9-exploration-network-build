create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.mcc (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  lux_balance numeric not null default 12480,
  mtc_treasury_balance numeric not null default 250000,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  mcc_id uuid not null references public.mcc(id) on delete cascade,
  rider_name text not null,
  wallet_address text not null unique,
  role text not null check (role in ('normal', 'owner')),
  standing_points integer not null default 0,
  mtc_balance integer not null default 0,
  total_scan_points integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rider_licenses (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  tier text not null check (tier in ('T1', 'T2', 'T3')),
  status text not null,
  issued_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists rider_licenses_active_idx
  on public.rider_licenses (rider_id, tier)
  where status = 'active';

create table if not exists public.rider_probe_inventory (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  probe_tier text not null check (probe_tier in ('T1', 'T2')),
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (rider_id, probe_tier)
);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  probe_tier text not null check (probe_tier in ('T1', 'T2')),
  source_target_id text not null,
  target_body_type text not null,
  scan_duration_seconds integer not null check (scan_duration_seconds >= 0),
  interruption_flag boolean not null default false,
  random_variance numeric not null default 0,
  result text not null,
  quality_score integer,
  raw_signal_strength numeric,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists scan_events_rider_result_created_idx
  on public.scan_events (rider_id, result, created_at desc);

create table if not exists public.data_items (
  id uuid primary key default gen_random_uuid(),
  scan_event_id uuid not null unique references public.scan_events(id) on delete cascade,
  owner_rider_id uuid not null references public.riders(id) on delete cascade,
  source_target_id text not null,
  rarity text not null,
  quality_score integer not null,
  item_integrity integer not null,
  target_valid boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  minted_from_scan_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists data_items_owner_created_idx
  on public.data_items (owner_rider_id, created_at desc);

create table if not exists public.daily_mtc_budgets (
  id uuid primary key default gen_random_uuid(),
  mcc_id uuid not null references public.mcc(id) on delete cascade,
  budget_date date not null,
  net_lux_performance numeric not null default 12480,
  mint_budget_mtc integer not null default 500,
  policy_name text not null default 'macana-default-policy',
  policy_snapshot jsonb not null default '{}'::jsonb,
  total_accepted_reward_points integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (mcc_id, budget_date)
);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  data_item_id uuid not null unique references public.data_items(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete cascade,
  budget_id uuid references public.daily_mtc_budgets(id) on delete set null,
  status text not null,
  target_valid boolean not null default true,
  integrity_valid boolean not null default true,
  freshness_valid boolean not null default true,
  duplicate_rank integer not null default 1,
  duplicate_penalty numeric not null default 1,
  rarity_multiplier numeric not null default 1,
  quality_multiplier numeric not null default 1,
  tier_multiplier numeric not null default 1,
  demand_multiplier numeric not null default 1,
  freshness_multiplier numeric not null default 1,
  reward_points integer not null default 0,
  mtc_reward integer not null default 0,
  standing_points_awarded integer not null default 0,
  rejection_reason text,
  processed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists redemptions_rider_processed_idx
  on public.redemptions (rider_id, processed_at desc);

create table if not exists public.persistent_satellites (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  satellite_name text not null,
  status text not null,
  source_target_id text,
  visible_to_radar boolean not null default true,
  coordinate_x numeric,
  coordinate_y numeric,
  coordinate_z numeric,
  deployed_at timestamptz,
  last_generated_at timestamptz,
  destroyed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rider_daily_t1_quota (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  quota_date date not null,
  quota_limit integer not null default 5,
  quota_used integer not null default 0 check (quota_used >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (rider_id, quota_date)
);

create trigger set_updated_at_mcc
before update on public.mcc
for each row execute function public.set_updated_at();

create trigger set_updated_at_riders
before update on public.riders
for each row execute function public.set_updated_at();

create trigger set_updated_at_rider_licenses
before update on public.rider_licenses
for each row execute function public.set_updated_at();

create trigger set_updated_at_rider_probe_inventory
before update on public.rider_probe_inventory
for each row execute function public.set_updated_at();

create trigger set_updated_at_daily_mtc_budgets
before update on public.daily_mtc_budgets
for each row execute function public.set_updated_at();

create trigger set_updated_at_persistent_satellites
before update on public.persistent_satellites
for each row execute function public.set_updated_at();

create trigger set_updated_at_rider_daily_t1_quota
before update on public.rider_daily_t1_quota
for each row execute function public.set_updated_at();

alter table public.mcc enable row level security;
alter table public.riders enable row level security;
alter table public.rider_licenses enable row level security;
alter table public.rider_probe_inventory enable row level security;
alter table public.scan_events enable row level security;
alter table public.data_items enable row level security;
alter table public.daily_mtc_budgets enable row level security;
alter table public.redemptions enable row level security;
alter table public.persistent_satellites enable row level security;
alter table public.rider_daily_t1_quota enable row level security;
