-- Minimal-retention alignment for a future LMS-embedded ClassFlow.
-- Raw student submissions should not be stored durably.
-- Persist only assignment/course refs and derived instructional insights.

alter table public.analysis_runs
  add column if not exists source_course_ref text,
  add column if not exists source_assignment_ref text;

alter table public.error_patterns
  add column if not exists source_course_ref text,
  add column if not exists source_assignment_ref text,
  add column if not exists affected_student_refs jsonb not null default '[]'::jsonb,
  add column if not exists confidence numeric(4,3),
  add column if not exists dismissed_at timestamptz;

comment on table public.analysis_runs is
'Tracks derived analysis execution metadata only. Do not store raw submission text or uploaded files here.';

comment on table public.error_patterns is
'Stores derived instructional patterns and lightweight LMS references only. Raw student work must not be persisted.';
