GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_reviewer_unique ON public.reviews (order_id, reviewer_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reviews_seller_idx ON public.reviews (seller_id) WHERE is_visible;

CREATE OR REPLACE FUNCTION public.get_farmer_leaderboard(p_limit integer DEFAULT 100)
RETURNS TABLE (
  seller_id uuid,
  full_name text,
  location text,
  avg_rating numeric,
  reviews_count bigint,
  five_star_count bigint,
  delivered_orders bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH r AS (
    SELECT seller_id,
           ROUND(AVG(rating)::numeric, 2) AS avg_rating,
           COUNT(*) AS reviews_count,
           COUNT(*) FILTER (WHERE rating = 5) AS five_star_count
    FROM public.reviews
    WHERE is_visible IS NOT FALSE
    GROUP BY seller_id
  ), o AS (
    SELECT seller_id, COUNT(*) AS delivered_orders
    FROM public.orders
    WHERE status = 'delivered' AND seller_id IS NOT NULL
    GROUP BY seller_id
  )
  SELECT r.seller_id,
         COALESCE(p.full_name, 'Fermer') AS full_name,
         p.location,
         r.avg_rating,
         r.reviews_count,
         r.five_star_count,
         COALESCE(o.delivered_orders, 0) AS delivered_orders
  FROM r
  LEFT JOIN public.profiles p ON p.user_id = r.seller_id
  LEFT JOIN o ON o.seller_id = r.seller_id
  ORDER BY r.avg_rating DESC, r.reviews_count DESC
  LIMIT LEAST(COALESCE(p_limit, 100), 100)
$$;

GRANT EXECUTE ON FUNCTION public.get_farmer_leaderboard(integer) TO anon, authenticated, service_role;