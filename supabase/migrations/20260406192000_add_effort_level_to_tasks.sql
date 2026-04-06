ALTER TABLE public.tasks
ADD COLUMN effort_level TEXT CHECK (effort_level IN ('Low', 'Medium', 'High'));
