// Shared error logger for Edge Functions.
// Writes to public.error_logs via service role and sends email to admin on 'critical'.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const ADMIN_EMAIL = "admin@gmail.com";

export type Severity = "info" | "warning" | "error" | "critical";

export interface LogErrorInput {
  function_name: string;
  severity?: Severity;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  user_id?: string | null;
}

export async function logError(input: LogErrorInput): Promise<void> {
  const severity = input.severity ?? "error";
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("[error-logger] missing service role env");
      return;
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        function_name: String(input.function_name).slice(0, 100),
        severity,
        message: String(input.message ?? "unknown").slice(0, 5000),
        stack: input.stack ? String(input.stack).slice(0, 8000) : null,
        context: input.context ?? {},
        user_id: input.user_id ?? null,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[error-logger] insert failed", res.status, t);
    }
  } catch (e) {
    console.error("[error-logger] threw", e);
  }

  if (severity === "critical" && RESEND_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "FarmTrade Error Hunter <onboarding@resend.dev>",
          to: [ADMIN_EMAIL],
          subject: `🚨 CRITICAL: ${input.function_name}`,
          html: `
            <h2>Kritik xatolik aniqlandi</h2>
            <p><b>Funksiya:</b> ${escape(input.function_name)}</p>
            <p><b>Xabar:</b> ${escape(input.message)}</p>
            <pre style="background:#f4f4f4;padding:12px;border-radius:6px;white-space:pre-wrap;">${escape(input.stack ?? "")}</pre>
            <p><b>Kontekst:</b></p>
            <pre style="background:#f4f4f4;padding:12px;border-radius:6px;">${escape(JSON.stringify(input.context ?? {}, null, 2))}</pre>
            <p><b>Foydalanuvchi:</b> ${escape(input.user_id ?? "noma'lum")}</p>
            <p><b>Vaqt:</b> ${new Date().toISOString()}</p>
          `,
        }),
      });
    } catch (e) {
      console.error("[error-logger] critical email failed", e);
    }
  }
}

function escape(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
