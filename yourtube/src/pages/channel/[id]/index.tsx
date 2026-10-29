import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function ChannelPage() {
  const router = useRouter();
  const channelId = typeof router.query.id === "string" ? router.query.id : "";
  const { user } = useUser();
  const [channel, setChannel] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Home");

  useEffect(() => {
    if (!router.isReady || !channelId) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [channelResponse, videoResponse] = await Promise.all([
          axiosInstance.get(`/user/${channelId}`),
          axiosInstance.get("/video/getall"),
        ]);
        if (!active) return;
        setChannel(channelResponse.data);
        const records = Array.isArray(videoResponse.data) ? videoResponse.data : [];
        setVideos(records.filter((video: any) => String(video.uploader) === channelId));
      } catch (loadError: any) {
        if (active) setError(loadError?.response?.data?.message || "Could not load this channel.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [router.isReady, channelId]);

  if (loading) return <main className="min-w-0 flex-1 p-8 text-center text-gray-600">Loading channel…</main>;
  if (error || !channel) return <main role="alert" className="min-w-0 flex-1 p-8 text-center text-gray-600">{error || "Channel not found."}</main>;
  const ownChannel = Boolean(user && String(user._id) === String(channel._id));

  return (
    <main className="min-h-screen min-w-0 flex-1 bg-white">
      <div className="mx-auto max-w-7xl">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="space-y-8 px-4 pb-8">
          {ownChannel && <VideoUploader channelId={channel._id} channelName={channel.channelname} />}
          {activeTab === "About" ? (
            <section className="max-w-2xl space-y-3 py-6">
              <h2 className="text-xl font-semibold">About this channel</h2>
              <p className="whitespace-pre-wrap text-gray-700">{channel.description || "This channel hasn’t added a description yet."}</p>
              {channel.joinedon && <p className="text-sm text-gray-500">Joined {new Date(channel.joinedon).toLocaleDateString()}</p>}
            </section>
          ) : <ChannelVideos videos={videos} />}
        </div>
      </div>
    </main>
  );
}
