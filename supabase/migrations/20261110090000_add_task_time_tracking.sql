ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS actual_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_started_at timestamp with time zone;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_actual_seconds_nonnegative;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_actual_seconds_nonnegative CHECK (actual_seconds >= 0);

COMMENT ON COLUMN public.tasks.actual_seconds IS 'Accumulated real working time recorded by the task timer.';
COMMENT ON COLUMN public.tasks.timer_started_at IS 'When the currently active timer started; null while paused.';
