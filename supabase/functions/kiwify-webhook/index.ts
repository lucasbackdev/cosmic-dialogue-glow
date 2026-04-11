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
    const body = await req.json();
    console.log("Kiwify webhook received:", JSON.stringify(body));

    // Validate webhook signature if KIWIFY_WEBHOOK_SECRET is set
    const webhookSecret = Deno.env.get("KIWIFY_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("x-kiwify-signature") || req.headers.get("signature") || new URL(req.url).searchParams.get("token");
      if (signature !== webhookSecret) {
        console.error("Invalid webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const event = body.order_status || body.event;
    const email = body.Customer?.email || body.customer?.email;
    const subscriptionId = body.Subscription?.id || body.subscription?.id || body.subscription_id;
    const orderId = body.Order?.order_id || body.order?.order_id || body.order_id;

    if (!email) {
      console.error("No email found in webhook payload");
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing event: ${event}, email: ${email}, subscription: ${subscriptionId}`);

    // Try to find user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u) => u.email === email);

    switch (event) {
      case "approved":
      case "paid":
      case "subscription_renewed":
      case "active": {
        // Calculate next expiry (30 days from now for monthly)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        if (subscriptionId) {
          // Upsert by kiwify_subscription_id
          const { error } = await supabase
            .from("subscriptions")
            .upsert(
              {
                email,
                user_id: user?.id || null,
                kiwify_subscription_id: subscriptionId,
                kiwify_order_id: orderId,
                status: "active",
                started_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
              },
              { onConflict: "kiwify_subscription_id" }
            );
          if (error) console.error("Error upserting subscription:", error);
        } else {
          // Insert new
          const { error } = await supabase.from("subscriptions").insert({
            email,
            user_id: user?.id || null,
            kiwify_order_id: orderId,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          });
          if (error) console.error("Error inserting subscription:", error);
        }
        break;
      }

      case "refunded":
      case "chargedback": {
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({ status: "refunded", cancelled_at: new Date().toISOString() })
            .eq("kiwify_subscription_id", subscriptionId);
        } else {
          await supabase
            .from("subscriptions")
            .update({ status: "refunded", cancelled_at: new Date().toISOString() })
            .eq("email", email)
            .eq("status", "active");
        }
        break;
      }

      case "subscription_cancelled":
      case "cancelled": {
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("kiwify_subscription_id", subscriptionId);
        } else {
          await supabase
            .from("subscriptions")
            .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
            .eq("email", email)
            .eq("status", "active");
        }
        break;
      }

      case "subscription_past_due":
      case "past_due": {
        if (subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("kiwify_subscription_id", subscriptionId);
        }
        break;
      }

      default:
        console.log("Unhandled event:", event);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
