import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  product_id: string;
  quantity: number;
  expected_version?: number; // For optimistic locking
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

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check rate limit (10 orders per minute)
    const { data: canProceed } = await serviceClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'create_order',
      p_max_requests: 10,
      p_window_seconds: 60
    });

    if (!canProceed) {
      return new Response(
        JSON.stringify({ success: false, error: "Juda ko'p so'rov. Biroz kuting." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const body: OrderRequest = await req.json();

    // Validate input
    if (!body.product_id || !body.quantity || body.quantity < 1) {
      throw new Error("Noto'g'ri ma'lumotlar");
    }

    if (body.quantity > 10000) {
      throw new Error("Miqdor juda katta");
    }

    // Get product with version check
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .select('*, profiles:seller_id (full_name)')
      .eq('id', body.product_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      throw new Error("Mahsulot topilmadi");
    }

    // Check version for optimistic locking
    if (body.expected_version !== undefined && product.version !== body.expected_version) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Mahsulot ma'lumotlari o'zgardi. Sahifani yangilang.",
          code: "VERSION_CONFLICT"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Check stock
    if (product.stock_quantity < body.quantity) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Omborda faqat ${product.stock_quantity} ${product.unit} mavjud`,
          available_stock: product.stock_quantity,
          code: "INSUFFICIENT_STOCK"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Prevent self-purchase
    if (product.seller_id === user.id) {
      throw new Error("O'z mahsulotingizni sotib ololmaysiz");
    }

    const totalPrice = product.price * body.quantity;

    // Use service client for atomic operation
    // 1. Update stock with version check
    const { data: updatedProduct, error: updateError } = await serviceClient
      .from('products')
      .update({ 
        stock_quantity: product.stock_quantity - body.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.product_id)
      .eq('version', product.version) // Optimistic lock
      .gte('stock_quantity', body.quantity)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Mahsulot sotib olingan. Sahifani yangilang.",
          code: "CONCURRENT_UPDATE"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // 2. Create order
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .insert({
        buyer_id: user.id,
        product_id: body.product_id,
        quantity: body.quantity,
        total_price: totalPrice,
        status: 'pending',
        seller_id: product.seller_id
      })
      .select()
      .single();

    if (orderError) {
      // Rollback stock
      await serviceClient
        .from('products')
        .update({ stock_quantity: product.stock_quantity })
        .eq('id', body.product_id);
      
      throw new Error("Buyurtma yaratishda xatolik");
    }

    // 3. Create escrow transaction
    await serviceClient
      .from('escrow_transactions')
      .insert({
        order_id: order.id,
        amount: totalPrice,
        status: 'held'
      });

    // 4. Get seller's commission rate
    const { data: sellerSub } = await serviceClient
      .from('user_subscriptions')
      .select('subscription_plans (commission_rate)')
      .eq('user_id', product.seller_id)
      .eq('status', 'active')
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plans = sellerSub?.subscription_plans as unknown as { commission_rate: number } | null;
    const commissionRate = plans?.commission_rate ?? 0.10;

    // 5. Create commission record
    await serviceClient
      .from('commissions')
      .insert({
        order_id: order.id,
        seller_id: product.seller_id,
        order_amount: totalPrice,
        commission_rate: commissionRate,
        commission_amount: totalPrice * commissionRate,
        status: 'pending'
      });

    // 6. Create order chat
    await serviceClient.rpc('create_order_chat', { p_order_id: order.id });

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          status: order.status,
          total_price: totalPrice,
          product_title: product.title,
          seller_name: product.profiles?.full_name
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error("Order error:", error);
    const message = error instanceof Error ? error.message : "Xatolik yuz berdi";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
