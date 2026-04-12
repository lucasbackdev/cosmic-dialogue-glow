
CREATE OR REPLACE FUNCTION public.check_daily_limit(p_user_id uuid, p_cost integer DEFAULT 1)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current INTEGER;
  v_limit INTEGER := 40;
  v_remaining INTEGER;
  v_email TEXT;
BEGIN
  -- Check if admin
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email = 'lucascombatplr@gmail.com' THEN
    RETURN json_build_object('success', true, 'remaining', 999999, 'limit', 999999, 'used', 0);
  END IF;

  INSERT INTO public.daily_usage (user_id, usage_date, operations_count)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT operations_count INTO v_current
  FROM public.daily_usage
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE
  FOR UPDATE;

  v_remaining := v_limit - v_current;

  IF (v_current + p_cost) > v_limit THEN
    RETURN json_build_object('success', false, 'remaining', GREATEST(v_remaining, 0), 'limit', v_limit, 'used', v_current);
  END IF;

  UPDATE public.daily_usage
  SET operations_count = operations_count + p_cost, updated_at = now()
  WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

  RETURN json_build_object('success', true, 'remaining', v_remaining - p_cost, 'limit', v_limit, 'used', v_current + p_cost);
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id uuid, p_action_type text, p_credits integer, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_credits_record user_credits%ROWTYPE;
  v_remaining INTEGER;
  v_email TEXT;
BEGIN
  -- Check if admin
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email = 'lucascombatplr@gmail.com' THEN
    RETURN json_build_object('success', true, 'remaining', 999999);
  END IF;

  SELECT * INTO v_credits_record
  FROM user_credits
  WHERE user_id = p_user_id AND period_end > now()
  ORDER BY period_end DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'no_credits', 'remaining', 0);
  END IF;

  v_remaining := v_credits_record.total_credits - v_credits_record.used_credits;

  IF v_remaining < p_credits THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_credits', 'remaining', v_remaining);
  END IF;

  UPDATE user_credits SET used_credits = used_credits + p_credits WHERE id = v_credits_record.id;

  INSERT INTO credit_transactions (user_id, credits_id, action_type, credits_used, description)
  VALUES (p_user_id, v_credits_record.id, p_action_type, p_credits, p_description);

  RETURN json_build_object('success', true, 'remaining', v_remaining - p_credits);
END;
$function$;
