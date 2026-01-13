
-- Fix RLS policies for rate_limits table
CREATE POLICY "Service role can manage rate limits" ON rate_limits
FOR ALL USING (true) WITH CHECK (true);

-- Users can insert their own rate limit entries (via edge functions)
CREATE POLICY "System can insert rate limits" ON rate_limits
FOR INSERT WITH CHECK (true);

-- Escrow insert policy for order creation
CREATE POLICY "System can create escrow on order" ON escrow_transactions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = escrow_transactions.order_id 
    AND o.buyer_id = auth.uid()
  )
);

-- Admins can update escrow status
CREATE POLICY "Admins can manage escrow" ON escrow_transactions
FOR ALL USING (has_role(auth.uid(), 'admin'));
