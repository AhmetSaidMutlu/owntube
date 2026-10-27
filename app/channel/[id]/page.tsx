"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { VideoCard } from "@/components/video-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Loader2, UserMinus } from "lucide-react";

interface ChannelInfo {
  channel_title: string;
  channel_thumbnail: string;
}

interface VideoItem {
  id: string;
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  channel_id: string;
  channel_title: string;
  channel_thumbnail?: string;
  published_at: string;
  video_url: string;
  is_watched?: boolean;
}

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [unsubscribeError, setUnsubscribeError] = useState<{ message: string; reauth?: boolean } | null>(null);

  useEffect(() => {
    loadChannel();
  }, [id]);

  async function loadChannel() {
    try {
      setLoading(true);
      const response = await fetch(`/api/channel/${id}`)
      if (!response.ok) {
        router.push('/auth/login')
        return
      }
      const { subscription: sub, videos: videoData } = await response.json()
      if (sub) setChannel({ channel_title: sub.channelTitle, channel_thumbnail: sub.channelThumbnail })
      setVideos((videoData || []).map((v: any) => ({
        id: v.id,
        video_id: v.videoId,
        title: v.title,
        description: v.description,
        thumbnail_url: v.thumbnailUrl,
        channel_id: v.channelId,
        channel_title: v.channelTitle,
        published_at: v.publishedAt,
        video_url: v.videoUrl,
        is_watched: v.isWatched,
        channel_thumbnail: sub?.channelThumbnail,
      })))
    } catch (err) {
      console.error("Error loading channel:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    try {
      setUnsubscribing(true);
      setUnsubscribeError(null);
      const response = await fetch(`/api/channel/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "reauth_required") {
          setUnsubscribeError({ message: "YouTube hesabından takipten çıkmak için izin gerekiyor. Lütfen YouTube bağlantısını yenileyin.", reauth: true });
        } else if (data.code === "quota_exceeded") {
          setUnsubscribeError({ message: "YouTube API kotası doldu. Yarın tekrar deneyin." });
        } else {
          setUnsubscribeError({ message: "Takipten çıkılamadı. Lütfen tekrar deneyin." });
        }
        return;
      }
      setConfirmOpen(false);
      router.push("/subscriptions");
    } catch (err) {
      console.error("Error unsubscribing:", err);
      setUnsubscribeError({ message: "Takipten çıkılamadı. Lütfen tekrar deneyin." });
    } finally {
      setUnsubscribing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel header */}
      <div className="border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {channel ? (
              <>
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                  {channel.channel_thumbnail ? (
                    <img
                      src={channel.channel_thumbnail}
                      alt={channel.channel_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                      {channel.channel_title.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="font-semibold text-base truncate">
                    {channel.channel_title}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {videos.length} videos
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            )}
          </div>

          <AlertDialog
            open={confirmOpen}
            onOpenChange={(open) => {
              if (unsubscribing) return;
              setConfirmOpen(open);
              if (!open) setUnsubscribeError(null);
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0" disabled={loading}>
                <UserMinus className="w-4 h-4" />
                Takibi Bırak
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {channel?.channel_title ?? "Bu kanalı"} takipten çıkarılsın mı?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Kanal YouTube hesabınızda takipten çıkarılacak ve bu kanala ait {videos.length} video veritabanından kalıcı olarak silinecek. Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {unsubscribeError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {unsubscribeError.message}
                  {unsubscribeError.reauth && (
                    <a href="/api/youtube-auth" className="block mt-1 font-medium underline">
                      YouTube bağlantısını yenile
                    </a>
                  )}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={unsubscribing}>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnsubscribe();
                  }}
                  disabled={unsubscribing}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {unsubscribing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Takibi Bırak
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Videos grid */}
      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        {loading ? (
          <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-video w-full rounded-xl bg-muted" />
                <div className="flex gap-2 pt-1">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No videos found for this channel. Try syncing first.
          </div>
        ) : (
          <div className="grid gap-x-4 gap-y-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.video_id || video.id}
                title={video.title}
                description={video.description}
                thumbnail={video.thumbnail_url}
                channelTitle={video.channel_title}
                channelThumbnail={video.channel_thumbnail}
                channelId={video.channel_id}
                publishedAt={video.published_at}
                videoUrl={video.video_url}
                isWatched={video.is_watched}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
