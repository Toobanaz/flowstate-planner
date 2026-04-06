
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  tag TEXT,
  energy_required INTEGER DEFAULT 3 CHECK (energy_required BETWEEN 1 AND 5),
  schedule_preference TEXT CHECK (schedule_preference IN ('morning', 'afternoon', 'evening')),
  ai_classified BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_logs" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);
