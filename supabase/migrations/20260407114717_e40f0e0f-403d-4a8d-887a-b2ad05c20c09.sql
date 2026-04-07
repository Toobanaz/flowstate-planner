
-- Add effort_level and user_id to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS effort_level text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to daily_logs
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all access to daily_logs" ON public.daily_logs;

-- Tasks RLS: users can only access their own data
CREATE POLICY "Users read own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily logs RLS: users can only access their own data
CREATE POLICY "Users read own logs" ON public.daily_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own logs" ON public.daily_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own logs" ON public.daily_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own logs" ON public.daily_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
