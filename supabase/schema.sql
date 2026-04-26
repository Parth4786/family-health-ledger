create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  relationship text not null,
  birth_year integer,
  conditions text not null default '',
  notes text not null default '',
  color_accent text not null default '#38bdf8',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  purpose text not null default '',
  dosage_per_day numeric(10,2) not null check (dosage_per_day > 0),
  schedule text[] not null default '{}',
  tablets_per_strip integer not null check (tablets_per_strip > 0),
  initial_strips_bought numeric(10,2) not null default 1 check (initial_strips_bought > 0),
  initial_total_cost numeric(10,2) not null default 0 check (initial_total_cost >= 0),
  start_date date not null,
  stop_date date,
  notes text not null default '',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete set null,
  label text not null,
  purchased_on date not null,
  strips_bought numeric(10,2) not null check (strips_bought > 0),
  tablets_per_strip integer not null check (tablets_per_strip > 0),
  total_cost numeric(10,2) not null check (total_cost >= 0),
  pharmacy text not null default '',
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  report_type text not null default 'Lab report',
  report_date date not null,
  summary text not null default '',
  file_url text not null default '',
  file_path text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists households_touch_updated_at on public.households;
create trigger households_touch_updated_at before update on public.households for each row execute function public.touch_updated_at();
drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at before update on public.patients for each row execute function public.touch_updated_at();
drop trigger if exists medicines_touch_updated_at on public.medicines;
create trigger medicines_touch_updated_at before update on public.medicines for each row execute function public.touch_updated_at();
drop trigger if exists purchases_touch_updated_at on public.purchases;
create trigger purchases_touch_updated_at before update on public.purchases for each row execute function public.touch_updated_at();
drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at before update on public.reports for each row execute function public.touch_updated_at();

alter table public.households enable row level security;
alter table public.patients enable row level security;
alter table public.medicines enable row level security;
alter table public.purchases enable row level security;
alter table public.reports enable row level security;

drop policy if exists "household owner can view own household" on public.households;
create policy "household owner can view own household" on public.households
for select using (owner_id = auth.uid());
drop policy if exists "household owner can insert own household" on public.households;
create policy "household owner can insert own household" on public.households
for insert with check (owner_id = auth.uid());
drop policy if exists "household owner can update own household" on public.households;
create policy "household owner can update own household" on public.households
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "patients scoped to own household" on public.patients;
create policy "patients scoped to own household" on public.patients
for all using (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()))
with check (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

drop policy if exists "medicines scoped to own household" on public.medicines;
create policy "medicines scoped to own household" on public.medicines
for all using (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()))
with check (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

drop policy if exists "purchases scoped to own household" on public.purchases;
create policy "purchases scoped to own household" on public.purchases
for all using (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()))
with check (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

drop policy if exists "reports scoped to own household" on public.reports;
create policy "reports scoped to own household" on public.reports
for all using (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()))
with check (exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid()));

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "authenticated users can upload own household reports" on storage.objects;
create policy "authenticated users can upload own household reports" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'reports'
  and exists (
    select 1
    from public.households h
    where h.owner_id = auth.uid()
      and split_part(name, '/', 1) = h.id::text
  )
);

drop policy if exists "authenticated users can read own household reports" on storage.objects;
create policy "authenticated users can read own household reports" on storage.objects
for select to authenticated
using (
  bucket_id = 'reports'
  and exists (
    select 1
    from public.households h
    where h.owner_id = auth.uid()
      and split_part(name, '/', 1) = h.id::text
  )
);
