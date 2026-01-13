
-- =============================================
-- FAZA 3: AI SYSTEM + TRUST + MONETIZATION
-- =============================================

-- 1. AI REQUEST QUEUE
CREATE TABLE IF NOT EXISTS ai_request_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  image_url TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_request_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ai_queue_user ON ai_request_queue(user_id);

ALTER TABLE ai_request_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI requests" ON ai_request_queue
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create AI requests" ON ai_request_queue
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 2. FARM PROFILES
CREATE TABLE IF NOT EXISTS farm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  farm_name TEXT,
  farm_size DECIMAL(10,2),
  farm_type TEXT[], -- ['sabzavot', 'meva', 'don']
  soil_type TEXT,
  irrigation_type TEXT,
  region TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farm_profiles_user ON farm_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_profiles_region ON farm_profiles(region);

ALTER TABLE farm_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own farm profile" ON farm_profiles
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own farm profile" ON farm_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own farm profile" ON farm_profiles
FOR UPDATE USING (user_id = auth.uid());

-- 3. DISEASE HISTORY
CREATE TABLE IF NOT EXISTS disease_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plant_name TEXT NOT NULL,
  disease_name TEXT,
  image_url TEXT,
  diagnosis JSONB,
  treatment_applied TEXT,
  treatment_result TEXT CHECK (treatment_result IN ('cured', 'improved', 'no_change', 'worsened')),
  diagnosed_at TIMESTAMPTZ DEFAULT now(),
  treated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disease_history_user ON disease_history(user_id);
CREATE INDEX IF NOT EXISTS idx_disease_history_plant ON disease_history(plant_name);
CREATE INDEX IF NOT EXISTS idx_disease_history_date ON disease_history(diagnosed_at DESC);

ALTER TABLE disease_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disease history" ON disease_history
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create disease history" ON disease_history
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own disease history" ON disease_history
FOR UPDATE USING (user_id = auth.uid());

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL UNIQUE,
  reviewer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible reviews" ON reviews
FOR SELECT USING (is_visible = true OR reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers can create reviews for their orders" ON reviews
FOR INSERT WITH CHECK (
  reviewer_id = auth.uid() AND
  EXISTS (SELECT 1 FROM orders WHERE id = reviews.order_id AND buyer_id = auth.uid() AND status = 'delivered')
);

CREATE POLICY "Users can update own reviews" ON reviews
FOR UPDATE USING (reviewer_id = auth.uid());

-- 5. SELLER VERIFICATIONS
CREATE TABLE IF NOT EXISTS seller_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('id_card', 'business_license', 'farm_photo', 'location')),
  document_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_verifications_user ON seller_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_verifications_status ON seller_verifications(status);

ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON seller_verifications
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own verification" ON seller_verifications
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update verifications" ON seller_verifications
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- 6. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB NOT NULL,
  max_products INTEGER,
  commission_rate DECIMAL(5,4),
  ai_queries_limit INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON subscription_plans
FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));

-- Insert default plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, features, max_products, commission_rate, ai_queries_limit) VALUES
('Bepul', 0, 0, '{"products": 5, "ai_queries": 10, "support": "basic", "analytics": false}', 5, 0.10, 10),
('Standart', 99000, 990000, '{"products": 50, "ai_queries": 100, "support": "priority", "analytics": true}', 50, 0.07, 100),
('Premium', 299000, 2990000, '{"products": -1, "ai_queries": -1, "support": "dedicated", "analytics": true, "api": true}', NULL, 0.05, NULL)
ON CONFLICT (name) DO NOTHING;

-- 7. USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON user_subscriptions
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions" ON user_subscriptions
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 8. COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  seller_id UUID NOT NULL,
  order_amount DECIMAL(15,2) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'paid_out')),
  created_at TIMESTAMPTZ DEFAULT now(),
  collected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commissions_seller ON commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own commissions" ON commissions
FOR SELECT USING (seller_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 9. SELLER BALANCES
CREATE TABLE IF NOT EXISTS seller_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  available_balance DECIMAL(15,2) DEFAULT 0,
  pending_balance DECIMAL(15,2) DEFAULT 0,
  total_earned DECIMAL(15,2) DEFAULT 0,
  total_withdrawn DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_balances_user ON seller_balances(user_id);

ALTER TABLE seller_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own balance" ON seller_balances
FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update balances" ON seller_balances
FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- 10. DAILY METRICS (Admin Dashboard)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  new_users INTEGER DEFAULT 0,
  new_farmers INTEGER DEFAULT 0,
  new_products INTEGER DEFAULT 0,
  new_orders INTEGER DEFAULT 0,
  total_gmv DECIMAL(15,2) DEFAULT 0,
  total_commission DECIMAL(15,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics" ON daily_metrics
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage metrics" ON daily_metrics
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 11. REGIONAL METRICS
CREATE TABLE IF NOT EXISTS regional_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  region TEXT NOT NULL,
  orders_count INTEGER DEFAULT 0,
  gmv DECIMAL(15,2) DEFAULT 0,
  active_farmers INTEGER DEFAULT 0,
  UNIQUE(date, region)
);

CREATE INDEX IF NOT EXISTS idx_regional_metrics_date ON regional_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_regional_metrics_region ON regional_metrics(region);

ALTER TABLE regional_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view regional metrics" ON regional_metrics
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage regional metrics" ON regional_metrics
FOR ALL USING (has_role(auth.uid(), 'admin'));
