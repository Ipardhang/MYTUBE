import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosinstance";
import { Play } from "lucide-react";

type VideoRecord = {
  _id: string;
  videotitle: string;
  description?: string;
  category?: string;
  videochanel?: string;
  uploader?: string;
  views?: number;
  createdAt?: string;
};

const SearchResult = ({ query }: { query: string }) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const searchVideos = async () => {
      const term = query.trim().toLocaleLowerCase();
      if (!term) { setVideos([]); setError(""); setLoading(false); return; }
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get("/video/getall");
        const records = Array.isArray(response.data) ? response.data : [];
        const matches = records.filter((video: VideoRecord) =>
          [video.videotitle, video.videochanel, video.description, video.category]
            .some((value) => String(value || "").toLocaleLowerCase().includes(term))
        );
        if (active) setVideos(matches);
      } catch {
        if (active) { setVideos([]); setError("Could not search videos. Make sure the API server is running."); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void searchVideos();
    return () => { active = false; };
  }, [query]);

  if (!query.trim()) return <p className="py-12 text-center text-gray-600">Enter a search term to find videos and channels.</p>;
  if (loading) return <p className="py-12 text-center text-gray-600">Searching videos…</p>;
  if (error) return <p role="alert" className="py-12 text-center text-red-700">{error}</p>;
  if (!videos.length) return <div className="py-12 text-center"><h2 className="text-xl font-semibold">No results found</h2><p className="mt-2 text-gray-600">Try different keywords.</p></div>;

  return (
    <div className="space-y-5">
      {videos.map((video) => (
        <article key={video._id} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href={`/watch/${video._id}`} className="group relative grid aspect-video place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-700 to-red-800 text-white sm:w-80 sm:shrink-0">
            <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px]">{video.category || "MyTube"}</span><span className="grid h-11 w-11 place-items-center rounded-full bg-white/15"><Play size={20} fill="currentColor" /></span>
          </Link>
          <div className="min-w-0 py-1">
            <Link href={`/watch/${video._id}`}><h2 className="line-clamp-2 text-lg font-medium hover:text-blue-700">{video.videotitle}</h2></Link>
            <p className="mt-2 text-sm text-gray-600">{(video.views || 0).toLocaleString()} views · {video.createdAt && !Number.isNaN(Date.parse(video.createdAt)) ? `${formatDistanceToNow(new Date(video.createdAt))} ago` : "recently"}</p>
            <Link href={`/channel/${video.uploader || ""}`} className="mt-3 inline-flex items-center gap-2 hover:text-blue-700">
              <Avatar className="h-7 w-7"><AvatarImage src="" /><AvatarFallback>{video.videochanel?.[0] || "M"}</AvatarFallback></Avatar>
              <span className="text-sm text-gray-600">{video.videochanel || "MyTube creator"}</span>
            </Link>
            {video.description && <p className="mt-2 line-clamp-2 text-sm text-gray-700">{video.description}</p>}
          </div>
        </article>
      ))}
      <p className="py-6 text-center text-sm text-gray-500">{videos.length} result{videos.length === 1 ? "" : "s"} for “{query}”</p>
    </div>
  );
};

export default SearchResult;
