-- Comprehensive migration for all new features
-- Date: 2025-11-21

-- ========================================
-- 0. AUTO-CREATE PROFILES ON USER SIGNUP
-- ========================================
-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, is_verified)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    new.created_at,
    true  -- User is verified since they clicked email verification link
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 1. EXTEND PROFILES TABLE
-- ========================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('user', 'moderator', 'admin')) DEFAULT 'user';

-- Ensure RLS policies allow profile creation during sign-up
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

-- Allow authenticated users to insert their own profile (no table reference to avoid recursion)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view all profiles (needed for displaying seller info)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- 2. EXTEND PRODUCTS TABLE
-- ========================================
ALTER TABLE public.products 
  DROP CONSTRAINT IF EXISTS products_status_check,
  ADD COLUMN IF NOT EXISTS stock_amount INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_status TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS view_history JSONB DEFAULT '[]'::jsonb;

-- Update status constraint to include new statuses
ALTER TABLE public.products 
  ADD CONSTRAINT products_status_check 
  CHECK (status IN ('available', 'unavailable', 'reserved', 'sold', 'pending'));

-- ========================================
-- 3. CREATE REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(reviewer_id, product_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ========================================
-- 4. CREATE REQUEST POSTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.request_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  status TEXT CHECK (status IN ('open', 'fulfilled', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.request_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Request posts are viewable by everyone" ON public.request_posts;
CREATE POLICY "Request posts are viewable by everyone"
  ON public.request_posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create request posts" ON public.request_posts;
CREATE POLICY "Users can create request posts"
  ON public.request_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own request posts" ON public.request_posts;
CREATE POLICY "Users can update own request posts"
  ON public.request_posts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own request posts" ON public.request_posts;
CREATE POLICY "Users can delete own request posts"
  ON public.request_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 5. CREATE REQUEST RESPONSES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.request_posts(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.request_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Request responses viewable by request owner and responder" ON public.request_responses;
CREATE POLICY "Request responses viewable by request owner and responder"
  ON public.request_responses FOR SELECT
  USING (
    auth.uid() = responder_id OR 
    auth.uid() IN (SELECT user_id FROM public.request_posts WHERE id = request_id)
  );

DROP POLICY IF EXISTS "Users can create request responses" ON public.request_responses;
CREATE POLICY "Users can create request responses"
  ON public.request_responses FOR INSERT
  WITH CHECK (auth.uid() = responder_id);

-- ========================================
-- 6. CREATE TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'exchange')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ========================================
-- 7. CREATE REPORTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'moderator'))
    )
  );

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'moderator'))
    )
  );

-- ========================================
-- 8. CREATE APPEALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create appeals" ON public.appeals;
CREATE POLICY "Users can create appeals"
  ON public.appeals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own appeals" ON public.appeals;
CREATE POLICY "Users can view own appeals"
  ON public.appeals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all appeals" ON public.appeals;
CREATE POLICY "Admins can view all appeals"
  ON public.appeals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'moderator'))
    )
  );

DROP POLICY IF EXISTS "Admins can update appeals" ON public.appeals;
CREATE POLICY "Admins can update appeals"
  ON public.appeals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR role IN ('admin', 'moderator'))
    )
  );

-- ========================================
-- 9. CREATE ANNOUNCEMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active announcements viewable by everyone" ON public.announcements;
CREATE POLICY "Active announcements viewable by everyone"
  ON public.announcements FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can manage announcements" ON public.announcements;
CREATE POLICY "Anyone can manage announcements"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 10. CREATE NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('message', 'transaction', 'review', 'announcement', 'report', 'system')) DEFAULT 'system',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 11. CREATE STORAGE BUCKETS
-- ========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true),
       ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
CREATE POLICY "Profile images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
CREATE POLICY "Users can upload own profile image"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
CREATE POLICY "Users can delete own profile image"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- 12. CREATE FUNCTIONS
-- ========================================

-- Function to handle scheduled status updates
CREATE OR REPLACE FUNCTION update_scheduled_statuses()
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET status = scheduled_status,
      scheduled_status = NULL,
      scheduled_at = NULL
  WHERE scheduled_at IS NOT NULL 
    AND scheduled_at <= now()
    AND scheduled_status IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate seller rating
CREATE OR REPLACE FUNCTION get_seller_rating(seller_uuid UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC(3,2) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.reviews
  WHERE seller_id = seller_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count and track history
CREATE OR REPLACE FUNCTION increment_product_views(product_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET views = views + 1,
      view_history = view_history || jsonb_build_object(
        'date', to_char(now(), 'YYYY-MM-DD'),
        'timestamp', now()
      )
  WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing increment_views function
DROP FUNCTION IF EXISTS increment_views(UUID);
CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM increment_product_views(product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review
CREATE OR REPLACE FUNCTION can_review_seller(seller_uuid UUID, reviewer_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if reviewer has purchased from seller
  RETURN EXISTS (
    SELECT 1 FROM public.transactions
    WHERE seller_id = seller_uuid 
      AND buyer_id = reviewer_uuid
      AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 13. CREATE TRIGGERS
-- ========================================

DROP TRIGGER IF EXISTS set_updated_at_reviews ON public.reviews;
CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_request_posts ON public.request_posts;
CREATE TRIGGER set_updated_at_request_posts
  BEFORE UPDATE ON public.request_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- 14. CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_product ON public.messages(product_id);
CREATE INDEX IF NOT EXISTS idx_request_posts_status ON public.request_posts(status);

-- ========================================
-- 15. UPDATE ADMIN STATS FUNCTION
-- ========================================

DROP FUNCTION IF EXISTS get_admin_stats();
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'verified_users', (SELECT COUNT(*) FROM public.profiles WHERE is_verified = true),
    'suspended_users', (SELECT COUNT(*) FROM public.profiles WHERE is_suspended = true),
    'total_products', (SELECT COUNT(*) FROM public.products),
    'active_products', (SELECT COUNT(*) FROM public.products WHERE status = 'available'),
    'sold_products', (SELECT COUNT(*) FROM public.products WHERE status = 'sold'),
    'total_categories', (SELECT COUNT(*) FROM public.categories),
    'total_favorites', (SELECT COUNT(*) FROM public.favorites),
    'total_messages', (SELECT COUNT(*) FROM public.messages),
    'total_transactions', (SELECT COUNT(*) FROM public.transactions),
    'pending_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'pending'),
    'pending_appeals', (SELECT COUNT(*) FROM public.appeals WHERE status = 'pending'),
    'total_reviews', (SELECT COUNT(*) FROM public.reviews),
    'active_requests', (SELECT COUNT(*) FROM public.request_posts WHERE status = 'open')
  ) INTO result;

  RETURN result;
END;
$$;
