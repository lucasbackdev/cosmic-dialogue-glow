
-- Table to track daily API operations per user
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  operations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily usage"
ON public.daily_usage FOR SELECT
USING (auth.uid() = user_id);

-- Function to check and increment daily usage (called from edge function with service role)
CREATE OR REPLACE FUNCTION public.check_daily_limit(p_user_id UUID, p_cost INTEGER DEFAULT 1)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current INTEGER;
  v_limit INTEGER := 40;
  v_remaining INTEGER;
BEGIN
  -- Upsert: create or get today's row
  INSERT INTO public.daily_usage (user_id, usage_date, operations_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- Get current count
  SELECT operations_count INTO v_current
  FROM public.daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE
  FOR UPDATE;

  v_remaining := v_limit - v_current;

  -- Check if adding this cost would exceed limit
  IF (v_current + p_cost) > v_limit THEN
    RETURN json_build_object(
      'success', false,
      'remaining', GREATEST(v_remaining, 0),
      'limit', v_limit,
      'used', v_current
    );
  END IF;

  -- Increment
  UPDATE public.daily_usage
  SET operations_count = operations_count + p_cost,
      updated_at = now()
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object(
    'success', true,
    'remaining', v_remaining - p_cost,
    'limit', v_limit,
    'used', v_current + p_cost
  );
END;
$$;

CREATE INDEX idx_daily_usage_user_date ON public.daily_usage (user_id, usage_date);
