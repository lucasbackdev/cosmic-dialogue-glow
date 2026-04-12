
-- User credits balance
CREATE TABLE public.user_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_credits INTEGER NOT NULL DEFAULT 1500,
  used_credits INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages credits"
ON public.user_credits FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);

CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Credit transactions log
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits_id UUID REFERENCES public.user_credits(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages transactions"
ON public.credit_transactions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_credits_id ON public.credit_transactions(credits_id);

-- Function to consume credits
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_action_type TEXT,
  p_credits INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits_record user_credits%ROWTYPE;
  v_remaining INTEGER;
BEGIN
  -- Get active credits record
  SELECT * INTO v_credits_record
  FROM user_credits
  WHERE user_id = p_user_id
    AND period_end > now()
  ORDER BY period_end DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'no_credits', 'remaining', 0);
  END IF;

  v_remaining := v_credits_record.total_credits - v_credits_record.used_credits;

  IF v_remaining < p_credits THEN
    RETURN json_build_object('success', false, 'error', 'insufficient_credits', 'remaining', v_remaining);
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET used_credits = used_credits + p_credits
  WHERE id = v_credits_record.id;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, credits_id, action_type, credits_used, description)
  VALUES (p_user_id, v_credits_record.id, p_action_type, p_credits, p_description);

  RETURN json_build_object('success', true, 'remaining', v_remaining - p_credits);
END;
$$;
