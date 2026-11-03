ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS deadline_date DATE,
  ADD COLUMN IF NOT EXISTS deadline_time TIME WITHOUT TIME ZONE;

COMMENT ON COLUMN public.tasks.deadline_date IS 'Optional browser-local calendar date by which the task is due.';
COMMENT ON COLUMN public.tasks.deadline_time IS 'Optional browser-local time by which the task is due; when no date is set, it applies to the current planning day.';
