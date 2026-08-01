import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logError } from "../_shared/error-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const raw = String((body as { code?: string }).code ?? "").trim();
    if (!/^\d{5}$/.test(raw)) return json({ error: "Kod 5 xonali raqam bo'lishi kerak" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: rows, error: selErr } = await admin
      .from("login_otp_codes")
      .select("id, code_hash, attempts, expires_at, used_at")
      .eq("user_id", user.id)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (selErr) throw new Error(selErr.message);

    const row = rows?.[0];
    if (!row) return json({ error: "Kod topilmadi. Yangi kod so'rang." }, 400);
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return json({ error: "Kod muddati tugagan. Yangi kod so'rang." }, 400);
    }
    if ((row.attempts ?? 0) >= 5) {
      return json({ error: "Juda ko'p xato urinish. Yangi kod so'rang." }, 429);
    }

    const hash = await sha256(`${user.id}:${raw}`);
    if (hash !== row.code_hash) {
      await admin.from("login_otp_codes").update({ attempts: (row.attempts ?? 0) + 1 }).eq("id", row.id);
      return json({ error: "Kod noto'g'ri" }, 400);
    }

    await admin.from("login_otp_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id);
    // Eski foydalanilmagan kodlarni bekor qilish
    await admin
      .from("login_otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("used_at", null);

    return json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logError({ function_name: "verify-login-otp", severity: "error", message: msg });
    return json({ error: "Tekshirishda xatolik", details: msg }, 500);
  }
});
