import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placa } = await req.json();

    if (!placa || typeof placa !== "string") {
      return new Response(
        JSON.stringify({ status: "erro", mensagem: "Placa não informada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate plate format: AAA0000 or AAA0A00
    const cleanPlaca = placa.replace(/[-\s]/g, "").toUpperCase();
    const plateRegex = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;
    if (!plateRegex.test(cleanPlaca)) {
      return new Response(
        JSON.stringify({ status: "erro", mensagem: "Formato de placa inválido. Use AAA0000 ou AAA0A00." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = Deno.env.get("CONSULTAR_PLACA_EMAIL");
    const apiKey = Deno.env.get("CONSULTAR_PLACA_API_KEY");

    if (!email || !apiKey) {
      return new Response(
        JSON.stringify({ status: "erro", mensagem: "Credenciais da API não configuradas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const basicAuth = btoa(`${email}:${apiKey}`);

    const apiResp = await fetch(
      `https://api.consultarplaca.com.br/v2/consultarPlaca?placa=${cleanPlaca}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );

    const data = await apiResp.json();

    return new Response(JSON.stringify(data), {
      status: apiResp.ok ? 200 : apiResp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("consultar-placa error:", err);
    return new Response(
      JSON.stringify({ status: "erro", mensagem: "Erro interno ao consultar placa" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
