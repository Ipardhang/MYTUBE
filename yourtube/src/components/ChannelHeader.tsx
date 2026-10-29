import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribers, setSubscribers] = useState(channel?.subscribers || 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSubscribers(channel?.subscribers || 0);
    if (!channel?._id || !user?._id) { setIsSubscribed(false); return; }
    let active = true;
    axiosInstance.get(`/user/${channel._id}/subscription`).then(({ data }) => {
      if (active) { setIsSubscribed(Boolean(data.subscribed)); setSubscribers(data.subscribers || 0); }
    }).catch(() => { if (active) setIsSubscribed(false); });
    return () => { active = false; };
  }, [channel?._id, channel?.subscribers, user?._id, user?.subscribedTo]);

  const toggleSubscribe = async () => {
    if (!user) { setMessage("Sign in to subscribe to this channel."); return; }
    setBusy(true);
    setMessage("");
    try {
      const response = await axiosInstance.post(`/user/${channel._id}/subscribe`);
      setIsSubscribed(Boolean(response.data.subscribed));
      setSubscribers(response.data.subscribers || 0);
    } catch (error: any) {
      setMessage(error?.response?.data?.message || "Could not update subscription.");
    } finally { setBusy(false); }
  };
  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      {/* Channel Info */}
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="w-20 h-20 md:w-32 md:h-32">
            <AvatarFallback className="text-2xl">
              {channel?.channelname?.[0] || "M"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold">{channel?.channelname}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>@{(channel?.channelname || "creator").toLowerCase().replace(/\s+/g, "")}</span>
              <span>{subscribers.toLocaleString()} subscribers</span>
            </div>
            {channel?.description && (
              <p className="text-sm text-gray-700 max-w-2xl">
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2">
              <Button
                disabled={busy}
                onClick={toggleSubscribe}
                variant={isSubscribed ? "outline" : "default"}
                className={
                  isSubscribed ? "bg-gray-100" : "bg-red-600 hover:bg-red-700"
                }
              >
                {busy ? "Please wait…" : isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
        {message && <p role="status" className="mt-3 text-sm text-amber-800">{message}</p>}
      </div>
    </div>
  );
};

export default ChannelHeader;
