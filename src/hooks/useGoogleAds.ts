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

  const invokeGoogleAds = useCallback(async (body: Record<string, unknown>) => {
    const callGoogleAds = async () => {
      const { data: result, error: invokeError } = await supabase.functions.invoke("google-ads", {
        body,
      });

      if (invokeError) throw invokeError;
      return result;
    };

    try {
      return await callGoogleAds();
    } catch (err: any) {
      const unauthorized = err?.message?.includes("401") || err?.message?.includes("Unauthorized");

      if (!unauthorized) throw err;

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData.session) {
        await supabase.auth.signOut();
        throw new Error("Sua sessão expirou. Entre novamente para continuar.");
      }

      return callGoogleAds();
    }
  }, []);

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

  const fetchMetrics = useCallback(async (p?: DatePeriod, campaignName?: string | null, targetCustomerId?: string) => {
    const activeCustomerId = targetCustomerId || customerId;
    if (!activeCustomerId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await invokeGoogleAds({
        customerId: activeCustomerId,
        period: p || period,
        campaignName: campaignName ?? undefined,
      });

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [customerId, invokeGoogleAds, period]);

  const saveCustomerId = useCallback(async (id: string) => {
    if (!userId) return;

    const cleanId = id.replace(/\s/g, "");
    setError(null);
    setLoading(true);

    await supabase.from("google_ads_accounts").upsert(
      { user_id: userId, customer_id: cleanId },
      { onConflict: "user_id,customer_id" }
    );

    setCustomerId(cleanId);

    try {
      const linkResult = await invokeGoogleAds({
        customerId: cleanId,
        action: "link",
      });

      await fetchMetrics(period, null, cleanId);

      return {
        success: true,
        message: linkResult?.message || "Solicitação de vinculação enviada com sucesso!",
      };
    } catch (err: any) {
      const message = err?.message || "Não foi possível enviar a solicitação de vínculo.";

      const alreadyLinked =
        message.includes("already") ||
        message.includes("ALREADY") ||
        message.includes("já está vinculada") ||
        message.includes("já existe") ||
        message.includes("ACTIVE") ||
        message.includes("PENDING");

      if (alreadyLinked) {
        await fetchMetrics(period, null, cleanId);
        return {
          success: true,
          message: "A conta já possui um vínculo ou convite pendente. Atualizando as métricas.",
        };
      }

      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }

  }, [fetchMetrics, invokeGoogleAds, period, userId]);

  useEffect(() => {
    if (customerId) fetchMetrics();
  }, [customerId, fetchMetrics]);

  const changePeriod = useCallback((p: DatePeriod) => {
    setPeriod(p);
    fetchMetrics(p);
  }, [fetchMetrics]);

  return { customerId, data, loading, error, saveCustomerId, fetchMetrics, period, changePeriod };
}
