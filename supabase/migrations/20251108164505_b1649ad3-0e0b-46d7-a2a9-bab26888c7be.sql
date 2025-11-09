-- Create function to increment product views
CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET views = views + 1
  WHERE id = product_id;
END;
$$;