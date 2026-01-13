
-- =============================================
-- FAZA 1: DATA & SECURITY LAYER
-- =============================================

-- 1. INDEKSLAR STRATEGIYASI
-- Products indekslari
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- Orders indekslari
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Crop events indekslari
CREATE INDEX IF NOT EXISTS idx_crop_events_user_id ON crop_events(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_events_event_date ON crop_events(event_date);

-- 2. OPTIMISTIC LOCKING (Version Column)
ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Version increment trigger
CREATE OR REPLACE FUNCTION increment_product_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = COALESCE(OLD.version, 1) + 1;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS products_version_trigger ON products;
CREATE TRIGGER products_version_trigger
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION increment_product_version();

-- 3. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON audit_logs(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by ON audit_logs(changed_by);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach audit triggers
DROP TRIGGER IF EXISTS orders_audit ON orders;
CREATE TRIGGER orders_audit AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS products_audit ON products;
CREATE TRIGGER products_audit AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 4. RATE LIMITING TABLE
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_action ON rate_limits(ip_address, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Clean old entries
  DELETE FROM rate_limits 
  WHERE window_start < now() - (p_window_seconds || ' seconds')::interval;
  
  -- Count requests in window
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id 
    AND action = p_action
    AND window_start > now() - (p_window_seconds || ' seconds')::interval;
  
  IF v_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update rate limit
  INSERT INTO rate_limits (user_id, action, count, window_start)
  VALUES (p_user_id, p_action, 1, now())
  ON CONFLICT (id) DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. ENHANCED ORDER STATUS
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS escrow_released BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_id UUID;

-- Update seller_id from product for easier queries
CREATE OR REPLACE FUNCTION set_order_seller_id()
RETURNS TRIGGER AS $$
BEGIN
  SELECT seller_id INTO NEW.seller_id
  FROM products WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_order_seller_trigger ON orders;
CREATE TRIGGER set_order_seller_trigger
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_seller_id();

-- 6. SOFT DELETE FOR PRODUCTS
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- 7. PRODUCT HISTORY TABLE
CREATE TABLE IF NOT EXISTS product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT now(),
  changed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_product_history_product ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_version ON product_history(product_id, version DESC);

ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product history" ON product_history
FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_history.product_id AND seller_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- Product history trigger
CREATE OR REPLACE FUNCTION save_product_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO product_history (product_id, version, data, changed_by)
  VALUES (OLD.id, OLD.version, row_to_json(OLD)::jsonb, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS products_history_trigger ON products;
CREATE TRIGGER products_history_trigger
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION save_product_history();

-- 8. ESCROW TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order participants can view escrow" ON escrow_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = escrow_transactions.order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin')
);
