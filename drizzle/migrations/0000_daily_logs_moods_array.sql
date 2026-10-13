ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS moods text[] NOT NULL DEFAULT '{}';
UPDATE public.daily_logs SET moods = ARRAY[mood] WHERE (moods IS NULL OR cardinality(moods) = 0) AND mood IS NOT NULL AND mood <> '';
ALTER TABLE public.daily_logs ADD CONSTRAINT daily_logs_moods_max_two CHECK (cardinality(moods) <= 2);
COMMENT ON COLUMN public.daily_logs.mood IS 'DEPRECATED: replaced by moods (array, up to 2). Still written with the first mood for older readers.';