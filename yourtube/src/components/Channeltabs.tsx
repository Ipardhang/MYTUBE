import React from "react";
import { Button } from "./ui/button";

const tabs = ["Home", "Videos", "About"] as const;

export default function ChannelTabs({ activeTab, onChange }: { activeTab: string; onChange: (tab: string) => void }) {
  return (
    <div className="border-b px-4">
      <nav aria-label="Channel sections" className="flex gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <Button key={tab} variant="ghost" className={`rounded-none border-b-2 px-0 py-4 ${activeTab === tab ? "border-black text-black" : "border-transparent text-gray-600 hover:text-black"}`} onClick={() => onChange(tab)}>
            {tab}
          </Button>
        ))}
      </nav>
    </div>
  );
}
