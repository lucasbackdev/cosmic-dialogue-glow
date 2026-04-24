import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAdsSummary {
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  conversions: number;
  totalCost: number;
}

interface GoogleAdsCampaign {
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number;
  conversions: number;
  cost: number;
}

interface TimeseriesPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  ctr: number;
  cpc: number;
}

interface GoogleAdsData {
  summary: GoogleAdsSummary;
  campaigns: GoogleAdsCampaign[];
  timeseries?: TimeseriesPoint[];
}

export type DatePeriod = "7d" | "30d" | "90d" | "all";

export function useGoogleAds(userId: string | undefined) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DatePeriod>("30d");

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("google_ads_accounts")
      .select("customer_id")
      .eq("user_id", userId)
      .limit(1)
      .then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          setCustomerId(rows[0].customer_id);
        }
      });
  }, [userId]);

  const saveCustomerId = useCallback(async (id: string) => {
    if (!userId) return;
    const cleanId = id.replace(/\s/g, "");
    setCustomerId(cleanId);
    setError(null);

    await supabase.from("google_ads_accounts").upsert(
      { user_id: userId, customer_id: cleanId },
      { onConflict: "user_id,customer_id" }
    );

    return { success: true, message: "Conta salva com sucesso! Buscando métricas..." };
  }, [userId]);

  const fetchMetrics = useCallback(async (p?: DatePeriod, campaignName?: string | null) => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-ads`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ customerId, period: p || period, campaignName: campaignName ?? undefined }),
        }
      );

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Erro ao buscar dados");
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId, period]);

  useEffect(() => {
    if (customerId) fetchMetrics();
  }, [customerId, fetchMetrics]);

  const changePeriod = useCallback((p: DatePeriod) => {
    setPeriod(p);
    fetchMetrics(p);
  }, [fetchMetrics]);

  return { customerId, data, loading, error, saveCustomerId, fetchMetrics, period, changePeriod };
}
