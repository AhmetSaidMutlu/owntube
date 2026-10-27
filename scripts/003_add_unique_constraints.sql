-- Add unique constraints for upsert operations

-- Subscriptions: unique on user_id + channel_id
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_channel_unique;

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_user_channel_unique 
UNIQUE (user_id, channel_id);

-- Videos: unique on user_id + video_id  
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_user_video_unique;

ALTER TABLE videos
ADD CONSTRAINT videos_user_video_unique 
UNIQUE (user_id, video_id);

-- Refresh times: unique on user_id
ALTER TABLE refresh_times
DROP CONSTRAINT IF EXISTS refresh_times_user_unique;

ALTER TABLE refresh_times
ADD CONSTRAINT refresh_times_user_unique 
UNIQUE (user_id);

-- User settings: unique on user_id
ALTER TABLE user_settings
DROP CONSTRAINT IF EXISTS user_settings_user_unique;

ALTER TABLE user_settings
ADD CONSTRAINT user_settings_user_unique 
UNIQUE (user_id);
