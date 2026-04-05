import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const _corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Google Ads API v17
const GOOGLE_ADS_API_VERSION = "v17";
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);

  // Create JWT header and claim set
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/adwords",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const enc = (obj: unknown) => {
    const json = JSON.stringify(obj);
    const b64 = btoa(json);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const unsignedToken = `${enc(header)}.${enc(claimSet)}`;

  // Import private key and sign
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

  // Exchange JWT for access token
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

  return tokenData.access_token;
}

async function fetchCampaignMetrics(
  accessToken: string,
  developerToken: string,
  customerId: string
) {
  // Remove hyphens from customer ID
  const cleanId = customerId.replace(/-/g, "");

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
    WHERE campaign.status != 'REMOVED'
      AND segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
    LIMIT 20
  `;

  const resp = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${cleanId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await resp.json();

  if (!resp.ok) {
    console.error("Google Ads API error:", JSON.stringify(data));
    throw new Error(
      data.error?.message || `Google Ads API error: ${resp.status}`
    );
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: _corsHeaders });
  }

  try {
    // Verify auth
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customerId } = await req.json();
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: "customerId is required" }),
        {
          status: 400,
          headers: { ..._corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const serviceAccountJson = Deno.env.get("GOOGLE_ADS_SERVICE_ACCOUNT_JSON");
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

    if (!serviceAccountJson || !developerToken) {
      return new Response(
        JSON.stringify({ error: "Google Ads credentials not configured" }),
        {
          status: 500,
          headers: { ..._corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const accessToken = await getAccessToken(serviceAccountJson);
    const rawData = await fetchCampaignMetrics(
      accessToken,
      developerToken,
      customerId
    );

    // Parse the response into a friendly format
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

    return new Response(
      JSON.stringify({ summary, campaigns }),
      {
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("google-ads function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      {
        status: 500,
        headers: { ..._corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
