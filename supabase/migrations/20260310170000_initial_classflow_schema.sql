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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  section text,
  period_label text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  summary text not null default '',
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assignment_objectives (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  objective_id uuid not null references public.learning_objectives(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (assignment_id, objective_id)
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  provider text not null default 'mock-analysis',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.error_patterns (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  objective_id uuid references public.learning_objectives(id) on delete set null,
  title text not null,
  description text not null default '',
  students_affected integer not null default 0 check (students_affected >= 0),
  affected_student_ids jsonb not null default '[]'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists classes_teacher_id_idx on public.classes (teacher_id);
create index if not exists assignments_teacher_id_idx on public.assignments (teacher_id);
create index if not exists assignments_class_id_idx on public.assignments (class_id);
create index if not exists learning_objectives_teacher_id_idx on public.learning_objectives (teacher_id);
create index if not exists assignment_objectives_teacher_id_idx on public.assignment_objectives (teacher_id);
create index if not exists assignment_objectives_assignment_id_idx on public.assignment_objectives (assignment_id);
create index if not exists analysis_runs_teacher_id_idx on public.analysis_runs (teacher_id);
create index if not exists analysis_runs_assignment_id_idx on public.analysis_runs (assignment_id);
create index if not exists error_patterns_teacher_id_idx on public.error_patterns (teacher_id);
create index if not exists error_patterns_assignment_id_idx on public.error_patterns (assignment_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_classes_updated_at on public.classes;
create trigger set_classes_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists set_assignments_updated_at on public.assignments;
create trigger set_assignments_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_learning_objectives_updated_at on public.learning_objectives;
create trigger set_learning_objectives_updated_at
before update on public.learning_objectives
for each row execute function public.set_updated_at();

drop trigger if exists set_error_patterns_updated_at on public.error_patterns;
create trigger set_error_patterns_updated_at
before update on public.error_patterns
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.assignment_objectives enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.error_patterns enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "classes_manage_own" on public.classes;
create policy "classes_manage_own" on public.classes
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "assignments_manage_own" on public.assignments;
create policy "assignments_manage_own" on public.assignments
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "learning_objectives_manage_own" on public.learning_objectives;
create policy "learning_objectives_manage_own" on public.learning_objectives
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "assignment_objectives_manage_own" on public.assignment_objectives;
create policy "assignment_objectives_manage_own" on public.assignment_objectives
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "analysis_runs_manage_own" on public.analysis_runs;
create policy "analysis_runs_manage_own" on public.analysis_runs
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "error_patterns_manage_own" on public.error_patterns;
create policy "error_patterns_manage_own" on public.error_patterns
for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
