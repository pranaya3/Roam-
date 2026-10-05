/* =========================================================
   ROAM — SUPABASE DATABASE SCHEMA
========================================================= */


/* =========================================================
   EXTENSIONS
========================================================= */

create extension if not exists pgcrypto;


/* =========================================================
   ROOMS
========================================================= */

create table if not exists public.rooms (

  id uuid
    primary key
    default gen_random_uuid(),

  code text
    not null
    unique,

  name text
    not null,

  location_text text
    not null,

  lat double precision,

  lng double precision,

  group_size integer
    not null
    check (
      group_size between 2 and 50
    ),

  candidate_dates jsonb
    not null
    default '[]'::jsonb,

  activity text,

  organizer_token text
    not null,

  created_at timestamptz
    not null
    default now()
);


/* =========================================================
   REMOVE OLD 5-CHARACTER CODE RULE
   Roam now uses one-word codes.
========================================================= */

alter table public.rooms
drop constraint if exists rooms_code_check;


/* =========================================================
   PARTICIPANTS
========================================================= */

create table if not exists public.participants (

  id uuid
    primary key
    default gen_random_uuid(),

  room_id uuid
    not null
    references public.rooms(id)
    on delete cascade,

  name text
    not null,

  participant_token text
    not null,

  availability jsonb
    not null
    default '{}'::jsonb,

  budget numeric,

  created_at timestamptz
    not null
    default now()
);


/* =========================================================
   INDEXES
========================================================= */

create index if not exists rooms_code_idx
on public.rooms(code);


create index if not exists participants_room_idx
on public.participants(room_id);


/* =========================================================
   ROW LEVEL SECURITY
========================================================= */

alter table public.rooms
enable row level security;


alter table public.participants
enable row level security;


/* =========================================================
   ROOMS — PUBLIC READ
========================================================= */

drop policy if exists
"rooms public read by code"
on public.rooms;


create policy
"rooms public read by code"
on public.rooms

for select

to anon, authenticated

using (true);


/* =========================================================
   ROOMS — PUBLIC CREATE
========================================================= */

drop policy if exists
"rooms public create"
on public.rooms;


create policy
"rooms public create"
on public.rooms

for insert

to anon, authenticated

with check (
  length(organizer_token) >= 20
);


/* =========================================================
   ROOMS — ORGANIZER UPDATE
========================================================= */

drop policy if exists
"rooms organizer update"
on public.rooms;


create policy
"rooms organizer update"
on public.rooms

for update

to anon, authenticated

using (true)

with check (true);


/* =========================================================
   PARTICIPANTS — PUBLIC READ
========================================================= */

drop policy if exists
"participants public read"
on public.participants;


create policy
"participants public read"
on public.participants

for select

to anon, authenticated

using (true);


/* =========================================================
   PARTICIPANTS — CREATE
========================================================= */

drop policy if exists
"participants create"
on public.participants;


create policy
"participants create"
on public.participants

for insert

to anon, authenticated

with check (
  length(participant_token) >= 20
);


/* =========================================================
   PARTICIPANTS — UPDATE
========================================================= */

drop policy if exists
"participants update"
on public.participants;


create policy
"participants update"
on public.participants

for update

to anon, authenticated

using (true)

with check (true);


/* =========================================================
   AVERAGE BUDGET FUNCTION
========================================================= */

create or replace function
public.get_room_average_budget(
  room_uuid uuid
)

returns table(
  average_budget numeric
)

language sql

security definer

set search_path = public

as $$

  select
    round(
      avg(budget)::numeric,
      2
    )

  from public.participants

  where room_id = room_uuid

    and budget is not null;

$$;


/* =========================================================
   FUNCTION PERMISSIONS
========================================================= */

revoke all

on function
public.get_room_average_budget(uuid)

from public;


grant execute

on function
public.get_room_average_budget(uuid)

to anon, authenticated;
