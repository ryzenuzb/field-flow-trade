import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchParams {
  query?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'created_at' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const url = new URL(req.url);
    const params: SearchParams = {
      query: url.searchParams.get('query') || undefined,
      category: url.searchParams.get('category') || undefined,
      location: url.searchParams.get('location') || undefined,
      minPrice: url.searchParams.get('minPrice') ? Number(url.searchParams.get('minPrice')) : undefined,
      maxPrice: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
      sortBy: (url.searchParams.get('sortBy') as SearchParams['sortBy']) || 'created_at',
      sortOrder: (url.searchParams.get('sortOrder') as SearchParams['sortOrder']) || 'desc',
      page: Math.max(1, Number(url.searchParams.get('page')) || 1),
      limit: Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20))
    };

    const offset = (params.page! - 1) * params.limit!;

    // Build query
    let query = supabaseClient
      .from('products')
      .select(`
        *,
        profiles:seller_id (full_name, location),
        reviews:reviews (rating)
      `, { count: 'exact' })
      .eq('is_active', true)
      .is('deleted_at', null)
      .gt('stock_quantity', 0);

    // Apply filters
    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    if (params.location) {
      query = query.ilike('location', `%${params.location}%`);
    }

    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }

    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }

    // Apply sorting
    const ascending = params.sortOrder === 'asc';
    query = query.order(params.sortBy!, { ascending });

    // Apply pagination
    query = query.range(offset, offset + params.limit! - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Calculate average ratings
    const productsWithRatings = data?.map(product => {
      const reviews = product.reviews || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length 
        : null;
      
      return {
        ...product,
        avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        review_count: reviews.length,
        reviews: undefined // Remove raw reviews from response
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: productsWithRatings,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: count,
          totalPages: Math.ceil((count || 0) / params.limit!)
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Search error:", error);
    const message = error instanceof Error ? error.message : "Qidirishda xatolik";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
