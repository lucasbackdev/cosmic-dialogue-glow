import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserCredits = {
  id: string;
  total_credits: number;
  used_credits: number;
  remaining: number;
  period_end: string;
};

export function useCredits(userId: string | undefined) {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCredits = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_credits")
      .select("id, total_credits, used_credits, period_end")
      .eq("user_id", userId)
      .gte("period_end", new Date().toISOString())
      .order("period_end", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      setCredits({
        ...data,
        remaining: data.total_credits - data.used_credits,
      });
    } else {
      setCredits(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  return { credits, loading, refresh: loadCredits };
}
