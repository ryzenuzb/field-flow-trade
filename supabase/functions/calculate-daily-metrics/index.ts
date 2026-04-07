import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date().toISOString().split("T")[0];
    const startOfDay = `${today}T00:00:00.000Z`;
    const endOfDay = `${today}T23:59:59.999Z`;

    // Parallel queries for today's metrics
    const [ordersRes, productsRes, usersRes, farmersRes, commissionsRes] = await Promise.all([
      supabase.from("orders").select("id, total_price", { count: "exact" })
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
      supabase.from("products").select("id", { count: "exact" })
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
      supabase.from("profiles").select("id", { count: "exact" })
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
      supabase.from("user_roles").select("id", { count: "exact" })
        .eq("role", "farmer")
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
      supabase.from("commissions").select("commission_amount")
        .gte("created_at", startOfDay).lte("created_at", endOfDay),
    ]);

    const totalGmv = (ordersRes.data || []).reduce((sum, o) => sum + Number(o.total_price || 0), 0);
    const totalCommission = (commissionsRes.data || []).reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);

    const metricsData = {
      date: today,
      new_orders: ordersRes.count || 0,
      new_products: productsRes.count || 0,
      new_users: usersRes.count || 0,
      new_farmers: farmersRes.count || 0,
      total_gmv: totalGmv,
      total_commission: totalCommission,
      active_users: 0,
    };

    // Upsert to avoid duplicates
    const { error } = await supabase
      .from("daily_metrics")
      .upsert(metricsData, { onConflict: "date" });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, date: today, metrics: metricsData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Daily metrics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
