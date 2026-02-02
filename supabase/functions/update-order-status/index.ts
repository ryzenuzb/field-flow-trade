import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Service role client for fetching user email
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { order_id, status } = await req.json();

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Get order details with product info
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, products(seller_id, title)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const oldStatus = order.status;

    // Check if user has permission (seller, admin, or buyer cancelling)
    const { data: hasAdminRole } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    const isSeller = order.products.seller_id === user.id;
    const isBuyer = order.buyer_id === user.id;
    const canCancel = isBuyer && status === 'cancelled' && order.status === 'pending';

    if (!hasAdminRole && !isSeller && !canCancel) {
      throw new Error('Permission denied');
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabaseClient
      .from('orders')
      .update({ status })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`Order ${order_id} status updated to ${status} by user ${user.id}`);

    // Deduct stock when order is accepted (status = processing)
    if (status === 'processing' && oldStatus === 'pending') {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('stock_quantity')
        .eq('id', order.product_id)
        .single();

      if (!productError && product) {
        const newStock = Math.max(0, (product.stock_quantity || 0) - order.quantity);
        
        const { error: stockError } = await supabaseClient
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', order.product_id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
        } else {
          console.log(`Stock updated for product ${order.product_id}: ${product.stock_quantity} -> ${newStock}`);
        }
      }
    }

    // Restore stock when order is cancelled (if it was already accepted)
    if (status === 'cancelled' && oldStatus === 'processing') {
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('stock_quantity')
        .eq('id', order.product_id)
        .single();

      if (!productError && product) {
        const newStock = (product.stock_quantity || 0) + order.quantity;
        
        const { error: stockError } = await supabaseClient
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', order.product_id);

        if (stockError) {
          console.error('Error restoring stock:', stockError);
        } else {
          console.log(`Stock restored for product ${order.product_id}: ${product.stock_quantity} -> ${newStock}`);
        }
      }
    }

    // Send email notification if status changed
    if (oldStatus !== status) {
      try {
        // Get buyer info
        const { data: buyerProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('user_id', order.buyer_id)
          .single();

        // Get buyer email from auth.users
        const { data: buyerAuth } = await supabaseAdmin.auth.admin.getUserById(order.buyer_id);

        if (buyerAuth?.user?.email) {
          const emailPayload = {
            order_id: order_id,
            new_status: status,
            buyer_email: buyerAuth.user.email,
            buyer_name: buyerProfile?.full_name || 'Foydalanuvchi',
            product_title: order.products.title,
            quantity: order.quantity,
            total_price: order.total_price
          };

          // Call email notification function
          const emailResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify(emailPayload)
            }
          );

          const emailResult = await emailResponse.json();
          console.log('Email notification result:', emailResult);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the main request if email fails
      }
    }

    return new Response(
      JSON.stringify({ success: true, order: updatedOrder }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
