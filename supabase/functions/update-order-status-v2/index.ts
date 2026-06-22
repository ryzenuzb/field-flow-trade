import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logError } from "../_shared/error-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'disputed'],
  delivered: ['disputed'],
  disputed: ['refunded', 'delivered'],
  refunded: [],
  cancelled: []
};

interface StatusUpdate {
  order_id: string;
  status: string;
  reason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body: StatusUpdate = await req.json();

    if (!body.order_id || !body.status) {
      throw new Error("order_id va status kerak");
    }

    // Get order with product info
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        products:product_id (seller_id, title, stock_quantity)
      `)
      .eq('id', body.order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Buyurtma topilmadi");
    }

    const isSeller = order.products?.seller_id === user.id;
    const isBuyer = order.buyer_id === user.id;

    // Check if user has admin role
    const { data: isAdmin } = await serviceClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    // Permission check
    if (!isSeller && !isBuyer && !isAdmin) {
      throw new Error("Bu buyurtmani o'zgartirish huquqingiz yo'q");
    }

    // Validate transition
    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(body.status)) {
      throw new Error(`${currentStatus} dan ${body.status} ga o'tish mumkin emas`);
    }

    // Role-based transition permissions
    const sellerAllowed = ['accepted', 'processing', 'shipped'];
    const buyerAllowed = ['cancelled', 'delivered', 'disputed'];
    const adminAllowed = ['refunded', 'cancelled'];

    if (!isAdmin) {
      if (isSeller && !sellerAllowed.includes(body.status)) {
        throw new Error("Bu statusni o'rnatish huquqingiz yo'q");
      }
      if (isBuyer && !buyerAllowed.includes(body.status)) {
        throw new Error("Bu statusni o'rnatish huquqingiz yo'q");
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    // Set timestamp fields
    if (body.status === 'accepted') updateData.accepted_at = new Date().toISOString();
    if (body.status === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (body.status === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (body.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      updateData.cancel_reason = body.reason;
    }
    if (body.status === 'disputed') updateData.dispute_reason = body.reason;

    // Update order
    const { error: updateError } = await serviceClient
      .from('orders')
      .update(updateData)
      .eq('id', body.order_id);

    if (updateError) throw updateError;

    // Handle escrow and stock based on status
    if (body.status === 'delivered') {
      // Release escrow to seller
      await serviceClient
        .from('escrow_transactions')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('order_id', body.order_id);

      await serviceClient
        .from('orders')
        .update({ escrow_released: true })
        .eq('id', body.order_id);

      // Update seller balance
      const { data: escrow } = await serviceClient
        .from('escrow_transactions')
        .select('amount')
        .eq('order_id', body.order_id)
        .single();

      const { data: commission } = await serviceClient
        .from('commissions')
        .select('commission_amount')
        .eq('order_id', body.order_id)
        .single();

      if (escrow && commission && order.products?.seller_id) {
        const netAmount = Number(escrow.amount) - Number(commission.commission_amount);
        
        // Update or create seller balance
        await serviceClient
          .from('seller_balances')
          .upsert({
            user_id: order.products.seller_id,
            available_balance: netAmount,
            total_earned: netAmount
          }, { onConflict: 'user_id' });
      }

      // Mark commission as collected
      await serviceClient
        .from('commissions')
        .update({ status: 'collected', collected_at: new Date().toISOString() })
        .eq('order_id', body.order_id);
    }

    if (body.status === 'cancelled' || body.status === 'refunded') {
      // Return stock
      if (order.products) {
        await serviceClient
          .from('products')
          .update({ 
            stock_quantity: order.products.stock_quantity + order.quantity 
          })
          .eq('id', order.product_id);
      }

      // Refund escrow
      await serviceClient
        .from('escrow_transactions')
        .update({ status: 'refunded', refunded_at: new Date().toISOString() })
        .eq('order_id', body.order_id);
    }

    // Send email notification to buyer (best-effort, do not fail on error)
    try {
      const { data: buyerProfile } = await serviceClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', order.buyer_id)
        .maybeSingle();

      if (buyerProfile?.email) {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              order_id: body.order_id,
              new_status: body.status,
              buyer_email: buyerProfile.email,
              buyer_name: buyerProfile.full_name || "Mijoz",
              product_title: order.products?.title || "Mahsulot",
              quantity: order.quantity,
              total_price: Number(order.total_price),
            }),
          }
        );
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-fatal):", emailErr);
      await logError({
        function_name: "update-order-status-v2",
        severity: "warning",
        message: "Order notification email failed",
        stack: emailErr instanceof Error ? emailErr.stack : undefined,
        context: { order_id: body.order_id, new_status: body.status },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: body.order_id,
        new_status: body.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Status update error:", error);
    const message = error instanceof Error ? error.message : "Status yangilashda xatolik";
    const stack = error instanceof Error ? error.stack : undefined;
    await logError({
      function_name: "update-order-status-v2",
      severity: "error",
      message,
      stack,
    });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
