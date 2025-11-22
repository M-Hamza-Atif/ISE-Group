-- Create a function to delete a user and all their data
-- This uses SECURITY DEFINER to run with elevated privileges

CREATE OR REPLACE FUNCTION delete_user_and_data(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete user's products (will cascade to related data due to foreign keys)
  DELETE FROM products WHERE seller_id = user_id_to_delete;
  
  -- Delete user's favorites
  DELETE FROM favorites WHERE user_id = user_id_to_delete;
  
  -- Delete user's messages (both sent and received)
  DELETE FROM messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
  
  -- Delete user's reviews (both given and received)
  DELETE FROM reviews WHERE reviewer_id = user_id_to_delete OR seller_id = user_id_to_delete;
  
  -- Delete user's request posts
  DELETE FROM request_posts WHERE user_id = user_id_to_delete;
  
  -- Delete user's transactions
  DELETE FROM transactions WHERE buyer_id = user_id_to_delete OR seller_id = user_id_to_delete;
  
  -- Delete user's reports
  DELETE FROM reports WHERE reporter_id = user_id_to_delete;
  
  -- Delete user's appeals
  DELETE FROM appeals WHERE user_id = user_id_to_delete;
  
  -- Delete user's notifications
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  
  -- Delete the user's profile
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Delete from auth.users table (this requires SECURITY DEFINER)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_and_data(UUID) TO authenticated;
