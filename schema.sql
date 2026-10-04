-- =========================================================
-- ROAM SUPABASE DATABASE
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- ROOMS
-- =========================================================

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),

  -- Roam invite code
  -- Example:
  -- HAPPY SUNSET PIZZA MUSIC FRIENDS
  code text not null unique,

  -- Name of the Roam
  name text not null,

  -- Location entered by organizer
  location_text text not null,

  -- Optional GPS coordinates
  lat double precision,

  lng double precision,

  -- Number of people expected
  group_size integer not null
    check (group_size between 2 and 50),

  -- Dates selected by organizer
  candidate_dates jsonb not null
    default '[]'::jsonb,

  -- Activity selected for the Roam
  activity text,

  -- Private organizer identifier
  organizer_token text not null,

  -- When the Roam was created
  created_at timestamptz not null
    default now()
);


-- =========================================================
-- PARTICIPANTS
-- =========================================================

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),

  -- Roam this participant belongs to
  room_id uuid not null
    references public.rooms(id)
    on delete cascade,

  -- Participant's name
  name text not null,

  -- Private participant identifier
  participant_token text not null,

  -- Availability information
  availability jsonb not null
    default '{}'::jsonb,

  -- Anonymous budget amount
  budget numeric,

  -- When participant joined
  created_at timestamptz not null
    default now()
);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists rooms_code_idx
on public.rooms(code);

create index if not exists participants_room_idx
on public.participants(room_id);


-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.rooms
enable row level security;

alter table public.participants
enable row level security;


-- =========================================================
-- ROOM POLICIES
-- =========================================================

drop policy if exists "rooms public read by code"
on public.rooms;

create policy "rooms public read by code"
on public.rooms
for select
to anon, authenticated
using (true);


drop policy if exists "rooms public create"
on public.rooms;

create policy "rooms public create"
on public.rooms
for insert
to anon, authenticated
with check (
  length(organizer_token) >= 20
);


drop policy if exists "rooms organizer update"
on public.rooms;

create policy "rooms organizer update"
on public.rooms
for update
to anon, authenticated
using (true)
with check (true);


-- =========================================================
-- PARTICIPANT POLICIES
-- =========================================================

drop policy if exists "participants public read"
on public.participants;

create policy "participants public read"
on public.participants
for select
to anon, authenticated
using (true);


drop policy if exists "participants create"
on public.participants;

create policy "participants create"
on public.participants
for insert
to anon, authenticated
with check (
  length(participant_token) >= 20
);


drop policy if exists "participants update"
on public.participants;

create policy "participants update"
on public.participants
for update
to anon, authenticated
using (true)
with check (true);


-- =========================================================
-- AVERAGE BUDGET FUNCTION
-- =========================================================

create or replace function public.get_room_average_budget(
  room_uuid uuid
)
returns table(
  average_budget numeric
)
language sql
security definer
set search_path = public
as $$
  select round(avg(budget)::numeric, 2)
  from public.participants
  where room_id = room_uuid
    and budget is not null;
$$;


-- =========================================================
-- FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.get_room_average_budget(uuid)
from public;

grant execute
on function public.get_room_average_budget(uuid)
to anon, authenticated;
