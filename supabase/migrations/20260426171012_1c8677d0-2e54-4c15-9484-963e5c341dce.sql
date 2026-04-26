-- Create function that enforces a global daily AI usage limit
-- shared across ALL users of the app, so the monthly $1 free credit
-- is spread evenly through the month instead of being burned in one day.
CREATE OR REPLACE FUNCTION public.check_global_ai_limit(p_daily_limit integer DEFAULT 15)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_used_today INTEGER;
  v_remaining INTEGER;
BEGIN
  -- Sum operations from ALL users for today
  SELECT COALESCE(SUM(operations_count), 0) INTO v_used_today
  FROM public.daily_usage
  WHERE usage_date = CURRENT_DATE;

  v_remaining := p_daily_limit - v_used_today;

  IF v_used_today >= p_daily_limit THEN
    RETURN json_build_object(
      'success', false,
      'error', 'global_daily_limit_reached',
      'used', v_used_today,
      'limit', p_daily_limit,
      'remaining', 0
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'used', v_used_today,
    'limit', p_daily_limit,
    'remaining', v_remaining
  );
END;
$$;