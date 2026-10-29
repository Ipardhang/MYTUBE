"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Play } from "lucide-react";

export default function VideoCard({ video }: any) {
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 via-slate-700 to-red-800 text-white transition-colors group-hover:from-slate-700 group-hover:to-red-700">
          <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium">{video?.category || "MyTube"}</span>
          <div className="flex max-w-[80%] flex-col items-center gap-2 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-white/15"><Play size={21} fill="currentColor" /></span><span className="line-clamp-2 text-sm font-semibold">{video?.videotitle || "Watch video"}</span></div>
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0] || "M"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{video?.videochanel}</p>
            <p className="text-sm text-gray-600">
              {(video?.views || 0).toLocaleString()} views •{" "}
              {video?.createdAt ? `${formatDistanceToNow(new Date(video.createdAt))} ago` : "recently"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
