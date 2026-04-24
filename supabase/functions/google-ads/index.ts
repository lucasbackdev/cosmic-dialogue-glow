import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const _corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_ADS_API_VERSION = "v23";
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: unknown) => {
    const json = JSON.stringify(obj);
    const b64 = btoa(json);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const unsignedToken = `${enc(header)}.${enc(claimSet)}`;
  const pemContent = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sigB64}`;

  console.log("Requesting access token for service account:", sa.client_email);

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResp.json();
  if (!tokenResp.ok) {
    console.error("Token error:", tokenData);
    throw new Error(`Failed to get access token: ${tokenData.error_description || tokenData.error}`);
  }

  console.log("Access token obtained successfully");
  return tokenData.access_token;
}

// Send a link invitation from MCC to client account
async function sendLinkInvitation(
  accessToken: string,
  developerToken: string,
  mccId: string,
  clientCustomerId: string
) {
  const cleanMccId = mccId.replace(/-/g, "");
  const cleanClientId = clientCustomerId.replace(/-/g, "");

  const url = `${GOOGLE_ADS_BASE}/customers/${cleanMccId}/customerClientLinks:mutate`;
  console.log("Link invitation URL:", url);
  console.log("MCC ID:", cleanMccId, "Client ID:", cleanClientId);
  console.log("Developer token (first 5 chars):", developerToken.slice(0, 5));

  const resp = await fetch(url,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": cleanMccId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: {
          create: {
            clientCustomer: `customers/${cleanClientId}`,
            status: "PENDING",
          },
        },
      }),
    }
  );

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response from link API:", text.slice(0, 500));
    throw new Error(`Google Ads API returned non-JSON response (status ${resp.status})`);
  }

  if (!resp.ok) {
    console.error("Link invitation error:", JSON.stringify(data));
    const errorMsg = data.error?.message || `Google Ads API error: ${resp.status}`;
    
    // Check for permission/access level issues
    if (resp.status === 403 || errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("DEVELOPER_TOKEN")) {
      throw new Error("Seu developer token possui apenas acesso básico (leitura). Para enviar convites de vinculação, é necessário solicitar Standard Access no Google Ads API Center.");
    }
    
    throw new Error(errorMsg);
  }

  return data;
}

function getPeriodClause(period?: string): string {
  switch (period) {
    case "7d": return "WHERE segments.date DURING LAST_7_DAYS";
    case "30d": return "WHERE segments.date DURING LAST_30_DAYS";
    case "90d": return "WHERE segments.date DURING LAST_90_DAYS";
    case "all": {
      // Google Ads exige filtro de data quando segments.date está no SELECT.
      // Usamos um range amplo (últimos ~5 anos) para simular "todo o período".
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 5);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      return `WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'`;
    }
    default: return "WHERE segments.date DURING LAST_30_DAYS";
  }
}

async function fetchCampaignMetrics(
  accessToken: string,
  developerToken: string,
  mccId: string,
  customerId: string,
  period?: string
) {
  const cleanId = customerId.replace(/-/g, "");

  const periodClause = getPeriodClause(period);
  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_micros
    FROM campaign
    ${periodClause}
    ORDER BY metrics.impressions DESC
    LIMIT 20
  `;

  const cleanMccId = mccId.replace(/-/g, "");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "login-customer-id": cleanMccId,
    "Content-Type": "application/json",
  };

  console.log("Fetching metrics for customer:", cleanId, "via MCC:", cleanMccId);

  const resp = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    }
  );

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response from metrics API:", text.slice(0, 500));
    throw new Error(`Google Ads API returned non-JSON response (status ${resp.status})`);
  }

  if (!resp.ok) {
    console.error("Google Ads API error:", JSON.stringify(data));
    throw new Error(data.error?.message || `Google Ads API error: ${resp.status}`);
  }

  return data;
}

async function fetchTimeseries(
  accessToken: string,
  developerToken: string,
  mccId: string,
  customerId: string,
  period?: string,
  campaignName?: string | null
) {
  const cleanId = customerId.replace(/-/g, "");
  const cleanMccId = mccId.replace(/-/g, "");
  const periodClause = getPeriodClause(period);
  const where = campaignName
    ? `${periodClause}${periodClause ? " AND" : "WHERE"} campaign.name = '${campaignName.replace(/'/g, "\\'")}'`
    : periodClause;

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_micros
    FROM campaign
    ${where}
    ORDER BY segments.date ASC
  `;

  const resp = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": cleanMccId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON timeseries response:", text.slice(0, 300));
    return [];
  }
  if (!resp.ok) {
    console.warn("Timeseries error:", JSON.stringify(data).slice(0, 300));
    return [];
  }

  // Aggregate by date (sum across campaigns when no campaignName filter)
  const byDate = new Map<string, { date: string; impressions: number; clicks: number; conversions: number; cost: number }>();
  if (Array.isArray(data)) {
    for (const batch of data) {
      if (batch.results) {
        for (const row of batch.results) {
          const date = row.segments?.date;
          if (!date) continue;
          const m = row.metrics || {};
          const cur = byDate.get(date) || { date, impressions: 0, clicks: 0, conversions: 0, cost: 0 };
          cur.impressions += Number(m.impressions || 0);
          cur.clicks += Number(m.clicks || 0);
          cur.conversions += Number(m.conversions || 0);
          cur.cost += Number(m.costMicros || 0) / 1_000_000;
          byDate.set(date, cur);
        }
      }
    }
  }

  return Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
      cpc: d.clicks > 0 ? d.cost / d.clicks : 0,
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: _corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { customerId, action, period, campaignName } = body;

    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "customerId is required" }),
        { status: 400, headers: { ..._corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const mccId = Deno.env.get("GOOGLE_ADS_MCC_ID");

    if (!serviceAccountJson || !developerToken || !mccId) {
      return new Response(
        JSON.stringify({ error: "Google Ads credentials not configured" }),
        { status: 500, headers: { ..._corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(serviceAccountJson);

    // Action: send link invitation
    if (action === "link") {
      const result = await sendLinkInvitation(accessToken, developerToken, mccId, customerId);
      return new Response(
        JSON.stringify({ success: true, message: "Solicitação de vinculação enviada com sucesso!", data: result }),
        { headers: { ..._corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: fetch metrics
    let rawData;
    try {
      rawData = await fetchCampaignMetrics(accessToken, developerToken, mccId, customerId, period);
    } catch (metricsErr: any) {
      console.warn("Metrics fetch failed (account may not be linked yet):", metricsErr.message);
      const emptySummary = { impressions: 0, clicks: 0, ctr: 0, averageCpc: 0, conversions: 0, totalCost: 0 };
      return new Response(
        JSON.stringify({ summary: emptySummary, campaigns: [], notLinked: true }),
        { headers: { ..._corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const campaigns: any[] = [];
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalCostMicros = 0;

    if (rawData && Array.isArray(rawData)) {
      for (const batch of rawData) {
        if (batch.results) {
          for (const row of batch.results) {
            const m = row.metrics || {};
            const impressions = Number(m.impressions || 0);
            const clicks = Number(m.clicks || 0);
            const conversions = Number(m.conversions || 0);
            const costMicros = Number(m.costMicros || 0);

            totalImpressions += impressions;
            totalClicks += clicks;
            totalConversions += conversions;
            totalCostMicros += costMicros;

            campaigns.push({
              name: row.campaign?.name || "Sem nome",
              status: row.campaign?.status || "UNKNOWN",
              impressions,
              clicks,
              ctr: Number(m.ctr || 0),
              averageCpc: Number(m.averageCpc || 0) / 1_000_000,
              conversions,
              cost: costMicros / 1_000_000,
            });
          }
        }
      }
    }

    const totalCost = totalCostMicros / 1_000_000;
    const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const overallCpc = totalClicks > 0 ? totalCost / totalClicks : 0;

    const summary = {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: overallCtr,
      averageCpc: overallCpc,
      conversions: totalConversions,
      totalCost,
    };

    const timeseries = await fetchTimeseries(
      accessToken,
      developerToken,
      customerId,
      period,
      campaignName || null
    ).catch(() => []);

    return new Response(
      JSON.stringify({ summary, campaigns, timeseries }),
      { headers: { ..._corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("google-ads function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ..._corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
