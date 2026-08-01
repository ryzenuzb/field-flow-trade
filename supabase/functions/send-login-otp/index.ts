import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { logError } from "../_shared/error-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Rate limit: max 3 codes per 10 minutes
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("login_otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Juda ko'p urinish. 10 daqiqadan keyin qayta urinib ko'ring." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const code = String(Math.floor(10000 + Math.random() * 90000));
    const code_hash = await sha256(`${user.id}:${code}`);

    const { error: insErr } = await admin.from("login_otp_codes").insert({
      user_id: user.id,
      email: user.email,
      phone: profile?.phone ?? null,
      code_hash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    if (insErr) throw new Error(`OTP insert failed: ${insErr.message}`);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#2d6a4f;margin:0 0 8px">FarmTrade — tasdiqlash kodi</h2>
        <p style="color:#444">Assalomu alaykum${profile?.full_name ? ", " + esc(profile.full_name) : ""}!</p>
        <p style="color:#444">Tizimga kirishni tasdiqlash uchun quyidagi 5 xonali kodni kiriting:</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#1b4332;background:#e9f5ee;border-radius:12px;padding:18px;text-align:center;margin:18px 0">${code}</div>
        <p style="color:#777;font-size:13px">Kod 5 daqiqa amal qiladi. Agar bu siz bo'lmasangiz, xabarni e'tiborsiz qoldiring.</p>
      </div>`;

    const { error: mailErr } = await resend.emails.send({
      from: "FarmTrade <onboarding@resend.dev>",
      to: [user.email],
      subject: `FarmTrade tasdiqlash kodi: ${code}`,
      html,
    });
    if (mailErr) throw new Error(`Resend failed: ${JSON.stringify(mailErr)}`);

    return new Response(JSON.stringify({ success: true, sent_to: user.email }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logError({ function_name: "send-login-otp", severity: "error", message: msg });
    return new Response(JSON.stringify({ error: "Kod yuborilmadi", details: msg }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
