ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS override_bucket text
    CHECK (override_bucket IS NULL OR override_bucket = 'do_now'),
  ADD COLUMN IF NOT EXISTS override_date date;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users insert own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users delete own tasks" ON public.tasks;

CREATE POLICY "Users read own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
