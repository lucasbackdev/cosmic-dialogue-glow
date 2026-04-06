import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ENDPOINTS: Record<string, { path: string; label: string }> = {
  basica: { path: "consultarPlaca", label: "Dados Básicos" },
  fipe: { path: "consultarPrecoFipe", label: "Preço FIPE" },
  sinistro: { path: "consultarSinistroComPerdaTotal", label: "Sinistro / Perda Total" },
  roubo: { path: "consultarHistoricoRouboFurto", label: "Histórico Roubo e Furto" },
  leilao: { path: "consultarRegistroLeilaoPrime", label: "Registro de Leilão" },
  gravame: { path: "consultarGravame", label: "Gravame / Financiamento" },
  infracoes: { path: "consultarRegistrosInfracoesRenainf", label: "Infrações (RENAINF)" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placa, tipos } = await req.json();

    if (!placa || typeof placa !== "string") {
      return new Response(
        JSON.stringify({ status: "erro", mensagem: "Placa não informada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Default to basic query if no types specified
    const requestedTypes: string[] = Array.isArray(tipos) && tipos.length > 0 
      ? tipos.filter((t: string) => ENDPOINTS[t]) 
      : ["basica"];

    const results: Record<string, unknown> = {};

    // Fetch all requested types in parallel
    const fetches = requestedTypes.map(async (tipo: string) => {
      const endpoint = ENDPOINTS[tipo];
      if (!endpoint) return;

      try {
        const resp = await fetch(
          `https://api.consultarplaca.com.br/v2/${endpoint.path}?placa=${cleanPlaca}`,
          { headers: { Authorization: `Basic ${basicAuth}` } }
        );
        const data = await resp.json();
        results[tipo] = { label: endpoint.label, ...data };
      } catch (err) {
        console.error(`Error fetching ${tipo}:`, err);
        results[tipo] = { label: endpoint.label, status: "erro", mensagem: `Erro ao consultar ${endpoint.label}` };
      }
    });

    await Promise.all(fetches);

    return new Response(JSON.stringify({ status: "ok", placa: cleanPlaca, resultados: results }), {
      status: 200,
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
