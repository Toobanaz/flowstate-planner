ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS moods TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE public.daily_logs
SET moods = ARRAY[mood]
WHERE cardinality(moods) = 0
  AND mood IS NOT NULL;

