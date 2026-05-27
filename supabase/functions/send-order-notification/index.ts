import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const statusLabels: Record<string, string> = {
  pending: "Kutilmoqda",
  processing: "Qabul qilindi",
  shipped: "Yuborildi",
  delivered: "Yetkazildi",
  cancelled: "Rad etildi",
};

const statusDescriptions: Record<string, string> = {
  processing: "Buyurtmangiz fermer tomonidan qabul qilindi va tayyorlanmoqda.",
  shipped: "Buyurtmangiz yuborildi va yetkazib berish jarayonida.",
  delivered: "Buyurtmangiz muvaffaqiyatli yetkazildi!",
  cancelled: "Afsuski, buyurtmangiz rad etildi.",
};

interface OrderNotificationRequest {
  order_id: string;
  new_status: string;
  buyer_email: string;
  buyer_name: string;
  product_title: string;
  quantity: number;
  total_price: number;
}

const VALID_STATUSES = new Set(['pending','accepted','processing','shipped','delivered','disputed','refunded','cancelled']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require service-role authorization (called from trusted edge functions only)
    const authHeader = req.headers.get("Authorization") || "";
    const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: OrderNotificationRequest = await req.json();
    const { order_id, new_status, buyer_email, buyer_name, product_title, quantity, total_price } = body;

    if (!order_id || !new_status || !buyer_email) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    if (!EMAIL_RE.test(String(buyer_email)) || String(buyer_email).length > 254) {
      return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }
    if (!VALID_STATUSES.has(String(new_status))) {
      return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log("Sending order notification email:", { order_id, new_status });

    const statusLabel = statusLabels[new_status] || new_status;
    const statusDescription = statusDescriptions[new_status] || "Buyurtmangiz holati yangilandi.";

    const safeName = esc(buyer_name).slice(0, 100);
    const safeTitle = esc(product_title).slice(0, 200);
    const safeStatusLabel = esc(statusLabel);
    const safeStatusDesc = esc(statusDescription);
    const safeStatusClass = esc(new_status);
    const safeQty = Number(quantity) || 0;
    const safeTotal = Number(total_price) || 0;
    const safeOrderId = esc(String(order_id).slice(0, 8));

    const emailResponse = await resend.emails.send({
      from: "FarmTrade <onboarding@resend.dev>",
      to: [buyer_email],
      subject: `Buyurtma holati: ${statusLabel} - ${product_title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .status-processing { background: #dbeafe; color: #1d4ed8; }
            .status-shipped { background: #fef3c7; color: #d97706; }
            .status-delivered { background: #d1fae5; color: #059669; }
            .status-cancelled { background: #fee2e2; color: #dc2626; }
            .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 FarmTrade</h1>
              <p>Buyurtma holati yangilandi</p>
            </div>
            <div class="content">
              <p>Assalomu alaykum, <strong>${buyer_name}</strong>!</p>
              
              <p>Sizning buyurtmangiz holati yangilandi:</p>
              
              <div class="status-badge status-${new_status}">
                ${statusLabel}
              </div>
              
              <p>${statusDescription}</p>
              
              <div class="order-details">
                <h3>Buyurtma ma'lumotlari:</h3>
                <p><strong>Mahsulot:</strong> ${product_title}</p>
                <p><strong>Miqdori:</strong> ${quantity}</p>
                <p><strong>Jami narx:</strong> ${total_price.toLocaleString()} so'm</p>
                <p><strong>Buyurtma ID:</strong> ${order_id.slice(0, 8)}...</p>
              </div>
              
              <p>Savollaringiz bo'lsa, bizga murojaat qiling.</p>
              
              <p>Hurmat bilan,<br>FarmTrade jamoasi</p>
            </div>
            <div class="footer">
              <p>Bu xabar avtomatik ravishda yuborilgan. Iltimos, javob bermang.</p>
              <p>© 2024 FarmTrade - O'zbekiston fermerlari uchun bozor</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
