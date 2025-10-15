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

    const { category, location, limit = 6 } = await req.json();

    let query = supabaseClient
      .from('products')
      .select('*, profiles!products_seller_id_fkey(full_name, location)')
      .eq('is_active', true)
      .gt('stock_quantity', 0);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (location) {
      query = query.eq('location', location);
    }

    const { data: products, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    console.log(`Retrieved ${products?.length || 0} product recommendations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products: products || [],
        count: products?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error getting product recommendations:', error);
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