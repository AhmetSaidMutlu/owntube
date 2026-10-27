-- Add is_active column to subscriptions table for enabling/disabling channels
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add channel_title column if it doesn't exist (alias for channel_name)
-- First check if channel_name exists and rename it to channel_title
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'channel_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'channel_title'
    ) THEN
        ALTER TABLE subscriptions RENAME COLUMN channel_name TO channel_title;
    END IF;
END $$;

-- Add video_url and thumbnail_url columns to videos table if they don't exist
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS channel_title TEXT;

-- Create unique constraint on user_id and channel_id for subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_channel_id_key'
    ) THEN
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_channel_id_key UNIQUE (user_id, channel_id);
    END IF;
END $$;

-- Create unique constraint on user_id and video_id for videos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'videos_user_id_video_id_key'
    ) THEN
        ALTER TABLE videos ADD CONSTRAINT videos_user_id_video_id_key UNIQUE (user_id, video_id);
    END IF;
END $$;

-- Create index for faster queries on is_active
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(user_id, is_active);
