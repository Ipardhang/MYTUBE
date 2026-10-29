import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

type Channel = { _id: string; channelname?: string; name?: string; description?: string; image?: string };

export default function SubscriptionsPage() {
  const { user } = useUser();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) { setChannels([]); setLoading(false); return; }
    let active = true;
    setLoading(true);
    axiosInstance.get("/user/subscriptions")
      .then(({ data }) => { if (active) setChannels(Array.isArray(data) ? data : []); })
      .catch((requestError: any) => { if (active) setError(requestError?.response?.data?.message || "Could not load subscriptions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?._id]);

  return (
    <main className="min-w-0 flex-1 p-5 sm:p-8">
      <h1 className="mb-2 text-2xl font-bold">Subscriptions</h1>
      <p className="mb-6 text-sm text-gray-600">Channels you follow appear here.</p>
      {!user && <p className="rounded-xl bg-gray-50 p-5 text-gray-700">Sign in to see your subscribed channels.</p>}
      {loading && <p className="py-8 text-gray-500">Loading subscriptions…</p>}
      {error && <p role="alert" className="py-4 text-red-700">{error}</p>}
      {!loading && user && !error && channels.length === 0 && <p className="rounded-xl bg-gray-50 p-5 text-gray-700">You haven’t subscribed to a channel yet. Open a video and select Subscribe on its channel.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Link key={channel._id} href={`/channel/${channel._id}`} className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-gray-50">
            <Avatar className="h-12 w-12"><AvatarImage src={channel.image || ""} /><AvatarFallback>{channel.channelname?.[0] || channel.name?.[0] || "M"}</AvatarFallback></Avatar>
            <span className="min-w-0"><span className="block truncate font-semibold">{channel.channelname || channel.name || "MyTube channel"}</span><span className="mt-1 line-clamp-2 block text-sm text-gray-600">{channel.description || "View this channel’s videos"}</span></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
