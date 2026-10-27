-- Create a function to sync subscriptions from the sync API
-- This will be called after fetching videos from YouTube

CREATE OR REPLACE FUNCTION sync_user_subscriptions(
  p_user_id UUID,
  p_subscriptions JSONB
)
RETURNS void AS $$
DECLARE
  v_subscription JSONB;
BEGIN
  -- Clear old subscriptions
  DELETE FROM subscriptions WHERE user_id = p_user_id;
  
  -- Insert new subscriptions
  FOR v_subscription IN SELECT * FROM jsonb_array_elements(p_subscriptions)
  LOOP
    INSERT INTO subscriptions (
      user_id,
      channel_id,
      channel_title,
      thumbnail_url
    ) VALUES (
      p_user_id,
      v_subscription->>'id',
      v_subscription->>'title',
      v_subscription->>'thumbnail'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_user_subscriptions TO authenticated;
