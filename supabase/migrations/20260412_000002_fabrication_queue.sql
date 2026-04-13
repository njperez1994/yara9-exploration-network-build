create table if not exists public.fabrication_jobs (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders(id) on delete cascade,
  item_id text not null,
  item_label text not null,
  build_action text not null check (build_action in ('live', 'mock')),
  build_duration_seconds integer not null check (build_duration_seconds > 0),
  output_probe_tier text check (output_probe_tier in ('T1', 'T2')),
  output_quantity integer not null default 0 check (output_quantity >= 0),
  status text not null check (status in ('queued', 'completed', 'cancelled')),
  queued_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz not null,
  ready_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ready_at >= started_at)
);

create index if not exists fabrication_jobs_rider_status_started_idx
  on public.fabrication_jobs (rider_id, status, started_at asc);

create index if not exists fabrication_jobs_rider_status_ready_idx
  on public.fabrication_jobs (rider_id, status, ready_at asc);

create trigger set_updated_at_fabrication_jobs
before update on public.fabrication_jobs
for each row execute function public.set_updated_at();

alter table public.fabrication_jobs enable row level security;
