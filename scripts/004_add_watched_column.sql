-- Add is_watched column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_watched BOOLEAN DEFAULT FALSE;

-- Add watched_at column to track when video was marked as watched
ALTER TABLE videos ADD COLUMN IF NOT EXISTS watched_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on watched status
CREATE INDEX IF NOT EXISTS idx_videos_is_watched ON videos(user_id, is_watched);

-- Create index for the sorting algorithm (unwatched new, unwatched old, watched old, watched new)
CREATE INDEX IF NOT EXISTS idx_videos_sort_algorithm ON videos(user_id, is_watched, published_at DESC);
