import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email as string;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to update subscriptions
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Link any unlinked subscriptions with this email to this user
    const { data: updated, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ user_id: userId })
      .eq("email", email)
      .is("user_id", null)
      .select("id");

    console.log(`Linked ${updated?.length || 0} subscriptions for ${email}`);

    // If subscriptions were linked, also create credits if not existing
    if (updated && updated.length > 0) {
      const { data: existingCredits } = await supabaseAdmin
        .from("user_credits")
        .select("id")
        .eq("user_id", userId)
        .gte("period_end", new Date().toISOString())
        .limit(1)
        .maybeSingle();
      if (!existingCredits) {
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);
        await supabaseAdmin.from("user_credits").insert({
          user_id: userId,
          total_credits: 1500,
          used_credits: 0,
          period_start: new Date().toISOString(),
          period_end: periodEnd.toISOString(),
        });
        console.log(`Created 1500 credits for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ linked: updated?.length || 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
