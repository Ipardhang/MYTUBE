import {
  Clock, Compass, History, Home, PlaySquare, Sparkles, ThumbsUp, User,
} from "lucide-react";
import Link from "next/link";
import React, { useState, type ElementType } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

const SidebarItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: ElementType }) => (
  <Link href={href} title={label}>
    <Button variant="ghost" className="w-full justify-center px-1 lg:justify-start lg:px-3" aria-label={label}>
      <Icon className="h-5 w-5 shrink-0 lg:mr-3" />
      <span className="hidden truncate lg:inline">{label}</span>
    </Button>
  </Link>
);

const Sidebar = () => {
  const { user } = useUser();
  const [isdialogeopen, setisdialogeopen] = useState(false);

  return (
    <aside className="sticky top-0 h-screen w-14 shrink-0 overflow-y-auto border-r bg-white p-1 sm:w-16 sm:p-2 lg:w-60">
      <nav className="space-y-1">
        <SidebarItem href="/" label="Home" icon={Home} />
        <SidebarItem href="/explore" label="Explore" icon={Compass} />
        <SidebarItem href="/subscriptions" label="Subscriptions" icon={PlaySquare} />
        <SidebarItem href="/internship" label="MyTube Studio" icon={Sparkles} />
        {user && (
          <div className="mt-2 space-y-1 border-t pt-2">
            <SidebarItem href="/history" label="History" icon={History} />
            <SidebarItem href="/liked" label="Liked videos" icon={ThumbsUp} />
            <SidebarItem href="/watch-later" label="Watch later" icon={Clock} />
            {user?.channelname ? (
              <SidebarItem href={"/channel/" + (user?._id || user?.id)} label="Your channel" icon={User} />
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center px-1 lg:justify-start lg:px-3"
                onClick={() => setisdialogeopen(true)}
                aria-label="Create channel"
                title="Create channel"
              >
                <User className="h-5 w-5 shrink-0 lg:mr-3" />
                <span className="hidden lg:inline">Create Channel</span>
              </Button>
            )}
          </div>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
