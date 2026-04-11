import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Subscription = {
  id: string;
  status: string;
  plan: string;
  started_at: string;
  expires_at: string | null;
};

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // First try to link any unlinked subscriptions by email
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.functions.invoke("link-subscription", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } catch (e) {
      console.log("Link subscription check:", e);
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("id, status, plan, started_at, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      const now = new Date();
      const expires = data.expires_at ? new Date(data.expires_at) : null;
      const active = !expires || expires > now;

      setSubscription(data);
      setIsActive(active);
    } else {
      setSubscription(null);
      setIsActive(false);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return { subscription, isActive, loading, refresh: checkSubscription };
}
