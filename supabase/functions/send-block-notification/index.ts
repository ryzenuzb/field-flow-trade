import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlockNotificationRequest {
  email: string;
  fullName: string;
  blockReason?: string;
  isBlocked: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, blockReason, isBlocked }: BlockNotificationRequest = await req.json();

    console.log(`Sending ${isBlocked ? 'block' : 'unblock'} notification to:`, email);

    // Validate required fields
    if (!email || !fullName) {
      throw new Error("Email va ism majburiy");
    }

    const subject = isBlocked 
      ? "FarmTrade - Hisobingiz bloklandi" 
      : "FarmTrade - Hisobingiz qayta faollashtirildi";

    const htmlContent = isBlocked 
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .reason-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Hisob Bloklandi</h1>
            </div>
            <div class="content">
              <p>Hurmatli <strong>${fullName}</strong>,</p>
              <p>Sizning FarmTrade platformasidagi hisobingiz admin tomonidan bloklandi.</p>
              ${blockReason ? `
              <div class="reason-box">
                <strong>Bloklash sababi:</strong>
                <p>${blockReason}</p>
              </div>
              ` : ''}
              <p>Agar siz bu qaror noto'g'ri deb hisoblasangiz, iltimos admin bilan bog'laning.</p>
              <p>Hurmat bilan,<br>FarmTrade jamoasi</p>
            </div>
            <div class="footer">
              © 2024 FarmTrade. Barcha huquqlar himoyalangan.
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
            .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Hisob Qayta Faollashtirildi</h1>
            </div>
            <div class="content">
              <p>Hurmatli <strong>${fullName}</strong>,</p>
              <div class="success-box">
                <p>Sizning FarmTrade platformasidagi hisobingiz qayta faollashtirildi!</p>
              </div>
              <p>Endi platformaga kirishingiz va barcha xizmatlardan foydalanishingiz mumkin.</p>
              <p>Hurmat bilan,<br>FarmTrade jamoasi</p>
            </div>
            <div class="footer">
              © 2024 FarmTrade. Barcha huquqlar himoyalangan.
            </div>
          </div>
        </body>
        </html>
      `;

    const emailResponse = await resend.emails.send({
      from: "FarmTrade <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Block notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-block-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
