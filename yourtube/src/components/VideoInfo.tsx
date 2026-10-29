import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import { toast } from "sonner";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [busyReaction, setBusyReaction] = useState(false);

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    if (!user) { setIsLiked(false); setIsDisliked(false); return; }
    let active = true;
    axiosInstance.get(`/like/status/${video._id}`).then(({ data }) => {
      if (active) { setIsLiked(data.reaction === "like"); setIsDisliked(data.reaction === "dislike"); }
    }).catch(() => { if (active) { setIsLiked(false); setIsDisliked(false); } });
    return () => { active = false; };
  }, [video._id, video.Like, video.Dislike, user?._id]);

  useEffect(() => {
    if (!user?._id || !video?._id) { setIsWatchLater(false); return; }
    let active = true;
    axiosInstance.get(`/watch/${user._id}`).then(({ data }) => {
      if (active) setIsWatchLater(Array.isArray(data) && data.some((entry: any) => String(entry.videoid?._id || entry.videoid) === String(video._id)));
    }).catch(() => { if (active) setIsWatchLater(false); });
    return () => { active = false; };
  }, [user?._id, video?._id]);

  useEffect(() => {
    const handleviews = async () => {
      if (user) {
        try {
          return await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } catch (error) {
          return console.log(error);
        }
      } else {
        return await axiosInstance.post(`/history/views/${video?._id}`);
      }
    };
    handleviews();
  }, [user?._id, video?._id]);
  const handleReaction = async (reaction: "like" | "dislike") => {
    if (!user) { toast.error("Sign in to react to videos."); return; }
    if (busyReaction) return;
    setBusyReaction(true);
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
        reaction,
      });
      setlikes(res.data.likes);
      setDislikes(res.data.dislikes);
      setIsLiked(res.data.liked);
      setIsDisliked(res.data.disliked);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save your reaction.");
    } finally { setBusyReaction(false); }
  };
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: video.videotitle, url });
      else { await navigator.clipboard.writeText(url); toast.success("Video link copied."); }
    } catch (error: any) {
      if (error?.name !== "AbortError") toast.error("Could not share this video.");
    }
  };
  const handleWatchLater = async () => {
    if (!user) { toast.error("Sign in to save videos to Watch later."); return; }
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-10 h-10">
              <AvatarFallback>{video.videochanel?.[0] || "M"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{video.videochanel}</h3>
            <p className="text-sm text-gray-600">1.2M subscribers</p>
          </div>
          <Button className="ml-4" onClick={() => router.push("/internship?tab=plans")}>Membership</Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-full">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full"
              disabled={busyReaction}
              onClick={() => void handleReaction("like")}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-black text-black" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full"
              disabled={busyReaction}
              onClick={() => void handleReaction("dislike")}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-black text-black" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 rounded-full ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 rounded-full"
            onClick={() => void handleShare()}
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 rounded-full"
            onClick={() => router.push("/internship?tab=downloads")}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex gap-4 text-sm font-medium mb-2">
          <span>{(video.views || 0).toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm ${showFullDescription ? "" : "line-clamp-3"}`}>
            <p className="whitespace-pre-wrap">{video.description || "No description has been added for this video."}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
