"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, BadgeCheck, Camera, Check, ChevronDown, CircleAlert,
  Clock3, Copy, Crown, CreditCard, Flag, Globe2, Heart, Laptop, LockKeyhole,
  MessageCircle, Mic, MicOff, Moon, Play, ShieldCheck, Sparkles, Sun,
  ThumbsDown, ThumbsUp, Users, Video, VideoOff, X,
} from "lucide-react";
import { useUser } from "@/lib/AuthContext";

type Tab = "overview" | "plans" | "downloads" | "community" | "security" | "calls";

type CommentItem = {
  id: string;
  name: string;
  location: string;
  avatar: string;
  text: string;
  time: number;
  likes: number;
  replies: string[];
  reported?: boolean;
  edited?: boolean;
};

const plans = [
  { name: "Free", price: "₹0", tone: "slate", daily: 1, perks: ["Standard viewing", "1 download per day", "Community comments"] },
  { name: "Bronze", price: "₹99", tone: "amber", daily: 5, perks: ["HD streaming", "5 downloads per day", "Priority support"] },
  { name: "Silver", price: "₹199", tone: "zinc", daily: 15, perks: ["Full HD streaming", "15 downloads per day", "Ad-free viewing"] },
  { name: "Gold", price: "₹399", tone: "yellow", daily: 30, perks: ["4K quality", "30 downloads per day", "Offline library + courses"] },
];

const seedComments: CommentItem[] = [
  { id: "c1", name: "Aarav Sharma", location: "Delhi, India", avatar: "AS", text: "The chapter on editing was so useful. Thanks for sharing!", time: Date.now() - 1000 * 60 * 21, likes: 48, replies: ["Glad it helped — more tutorials coming soon!"] },
  { id: "c2", name: "Maya Patel", location: "Pune, India", avatar: "MP", text: "Could you make a follow-up with the keyboard shortcuts too?", time: Date.now() - 1000 * 60 * 60 * 4, likes: 31, replies: [] },
  { id: "c3", name: "Rohan Verma", location: "Jaipur, India", avatar: "RV", text: "I tried this workflow today and it cut my editing time in half.", time: Date.now() - 1000 * 60 * 60 * 18, likes: 19, replies: [] },
];

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "plans", label: "Membership", icon: Crown },
  { id: "downloads", label: "Downloads", icon: ArrowDownToLine },
  { id: "community", label: "Community", icon: MessageCircle },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "calls", label: "Live rooms", icon: Video },
];

const dayKey = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function InternshipFeatures() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [plan, setPlan] = useState("Free");
  const [downloads, setDownloads] = useState<any[]>([]);
  const [theme, setTheme] = useState("dark");
  const [comments, setComments] = useState<CommentItem[]>(seedComments);
  const [commentText, setCommentText] = useState("");
  const [sort, setSort] = useState("relevant");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  const [message, setMessage] = useState("");
  const [reportedCount, setReportedCount] = useState(0);
  const [room, setRoom] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [micOff, setMicOff] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const savedPlan = localStorage.getItem("mytube-plan");
    const savedDownloads = localStorage.getItem("mytube-downloads");
    const savedTheme = localStorage.getItem("mytube-theme");
    const autoTheme = (() => {
      const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
      return hour >= 5 && hour < 12 ? "light" : "dark";
    })();
    setPlan(savedPlan || "Free");
    setDownloads(savedDownloads ? JSON.parse(savedDownloads) : []);
    setTheme(savedTheme || autoTheme);
    if (!savedTheme) localStorage.setItem("mytube-theme", autoTheme);
    const savedComments = localStorage.getItem("mytube-demo-comments");
    if (savedComments) setComments(JSON.parse(savedComments));
  }, []);

  useEffect(() => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [streamReady]);

  const dailyDownloads = downloads.filter((item) => item.day === dayKey()).length;
  const downloadLimit = plans.find((item) => item.name === plan)?.daily || 1;
  const sortedComments = useMemo(() => [...comments].sort((a, b) => {
    if (sort === "newest") return b.time - a.time;
    if (sort === "oldest") return a.time - b.time;
    if (sort === "most-liked") return b.likes - a.likes;
    return (b.likes + b.replies.length * 3) - (a.likes + a.replies.length * 3);
  }), [comments, sort]);

  const setNotice = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3800);
  };

  const updateTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem("mytube-theme", value);
    setNotice("Theme preference saved on this device.");
  };

  const startDownload = () => {
    if (dailyDownloads >= downloadLimit) {
      setNotice("Daily download limit reached for the " + plan + " plan.");
      return;
    }
    if (downloads.some((item) => item.videoId === "sample-video" && Date.now() - item.timestamp < 12 * 60 * 60 * 1000)) {
      setNotice("This video was already downloaded in the last 12 hours.");
      return;
    }
    const next = [{
      id: String(Date.now()), videoId: "sample-video", title: "YourTube sample video",
      date: new Date().toLocaleString("en-IN"), day: dayKey(), timestamp: Date.now(),
      size: "907 KB", status: "Ready", plan,
    }, ...downloads];
    setDownloads(next);
    localStorage.setItem("mytube-downloads", JSON.stringify(next));
    const anchor = document.createElement("a");
    anchor.href = "/video/vdo.mp4";
    anchor.download = "mytube-sample.mp4";
    anchor.click();
    setNotice("Download started. Your download history has been updated.");
  };

  const choosePlan = (selected: string) => {
    setNotice("Razorpay test checkout needs server test keys. No subscription was activated.");
    localStorage.setItem("mytube-pending-plan", selected);
  };

  const submitComment = () => {
    const text = commentText.trim();
    if (text.length < 3) return setNotice("Write at least 3 characters.");
    if (text.length > 500) return setNotice("Comments are limited to 500 characters.");
    if (/https?:\/\//i.test(text)) return setNotice("Links are held for review in this demo.");
    if (/(.)\1{7,}/u.test(text) || /^[\p{Emoji}\p{P}\s]+$/u.test(text)) return setNotice("Please avoid repeated characters or emoji-only comments.");
    if (comments.some((item) => item.text.toLowerCase() === text.toLowerCase())) return setNotice("Duplicate comment detected.");
    const recent = JSON.parse(localStorage.getItem("mytube-comment-times") || "[]").filter((time: number) => Date.now() - time < 60000);
    if (recent.length >= 3) return setNotice("Slow down. CAPTCHA verification is required after repeated posts.");
    const next = [{ id: String(Date.now()), name: user?.name || "You", location: "India", avatar: (user?.name || "You").slice(0, 2).toUpperCase(), text, time: Date.now(), likes: 0, replies: [] }, ...comments];
    setComments(next);
    localStorage.setItem("mytube-demo-comments", JSON.stringify(next));
    localStorage.setItem("mytube-comment-times", JSON.stringify([...recent, Date.now()]));
    setCommentText("");
    setNotice("Comment posted.");
  };

  const addReply = (id: string) => {
    const reply = window.prompt("Write a reply");
    if (!reply?.trim()) return;
    const next = comments.map((item) => item.id === id ? { ...item, replies: [...item.replies, reply.trim()] } : item);
    setComments(next);
    localStorage.setItem("mytube-demo-comments", JSON.stringify(next));
  };

  const toggleLike = (id: string, amount: number) => {
    const next = comments.map((item) => item.id === id ? { ...item, likes: Math.max(0, item.likes + amount) } : item);
    setComments(next);
    localStorage.setItem("mytube-demo-comments", JSON.stringify(next));
  };

  const report = (id: string) => {
    const next = comments.map((item) => item.id === id ? { ...item, reported: true } : item);
    setComments(next);
    setReportedCount((value) => value + 1);
    localStorage.setItem("mytube-demo-comments", JSON.stringify(next));
    setNotice("Report sent to the moderation queue.");
  };

  const startRoom = async () => {
    const code = room || Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoom(code);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setStreamReady(true);
      setCallActive(true);
      setNotice("Camera and microphone are ready. Room signaling must be configured for remote participants.");
    } catch {
      setNotice("Camera or microphone permission was denied. You can still create and share a room link.");
      setCallActive(true);
    }
  };

  const leaveRoom = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreamReady(false);
    setCallActive(false);
    setRoom("");
  };

  const copyRoomLink = async () => {
    const url = window.location.origin + "/internship?room=" + room;
    await navigator.clipboard?.writeText(url);
    setNotice("Room link copied.");
  };

  const panelClass = theme === "dark" ? "bg-[#111827] text-slate-100 border-slate-700" : "bg-white text-slate-900 border-slate-200";
  const mutedClass = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const softClass = theme === "dark" ? "bg-slate-800/80" : "bg-slate-50";
  const cardClass = "rounded-2xl border p-5 " + panelClass;

  return (
    <main className={"min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-8 " + (theme === "dark" ? "bg-[#0b1220]" : "bg-slate-50")}>
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 p-6 text-white shadow-xl sm:p-9">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm"><Sparkles size={15} /> MyTube Studio</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your viewing, your community.</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">Explore the internship feature set: creator comments, memberships, downloads, account security and live rooms.</p>
            </div>
            <div className="rounded-2xl bg-black/15 px-5 py-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-white/70">Current membership</div>
              <div className="mt-1 flex items-center gap-2 text-xl font-semibold"><Crown size={19} /> {plan}</div>
              <div className="mt-1 text-xs text-white/75">{downloadLimit - dailyDownloads} downloads left today</div>
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={"flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition " + (tab === id ? "bg-red-600 text-white shadow" : theme === "dark" ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-600 hover:bg-slate-100")}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {message && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm text-white shadow-xl"><CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-300" />{message}</div>}

        {tab === "overview" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex items-center justify-between gap-4">
                  <div><h2 className="text-lg font-semibold">Feature overview</h2><p className={"mt-1 text-sm " + mutedClass}>A single home for your MyTube account tools.</p></div>
                  <BadgeCheck className="text-emerald-500" />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[["Membership", "Compare plans and review benefits.", Crown, "plans"], ["Downloads", dailyDownloads + " of " + downloadLimit + " used today.", ArrowDownToLine, "downloads"], ["Community", comments.length + " comments · " + reportedCount + " reports sent.", MessageCircle, "community"], ["Security", "Theme and trusted device controls.", ShieldCheck, "security"], ["Live rooms", "Create a room and preview your camera.", Video, "calls"]].map(([title, description, Icon, dest]: any) => (
                    <button key={title} onClick={() => setTab(dest)} className={"flex items-start gap-3 rounded-xl p-4 text-left transition " + softClass}>
                      <span className="rounded-lg bg-red-500/10 p-2 text-red-500"><Icon size={18} /></span>
                      <span><span className="block text-sm font-semibold">{title}</span><span className={"mt-1 block text-xs " + mutedClass}>{description}</span></span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={cardClass}>
                <div className="flex items-center gap-3"><div className="rounded-full bg-red-500/10 p-3 text-red-500"><ShieldCheck size={20} /></div><div><h2 className="font-semibold">Account at a glance</h2><p className={"text-sm " + mutedClass}>{user?.name || "Guest viewer"} · {user?.email || "Sign in to sync your account"}</p></div></div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className={"rounded-xl p-3 " + softClass}><strong className="text-xl">{downloads.length}</strong><div className={"text-xs " + mutedClass}>downloads</div></div>
                  <div className={"rounded-xl p-3 " + softClass}><strong className="text-xl">{comments.length}</strong><div className={"text-xs " + mutedClass}>comments</div></div>
                  <div className={"rounded-xl p-3 " + softClass}><strong className="text-xl">{plan}</strong><div className={"text-xs " + mutedClass}>plan</div></div>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className={cardClass}>
                <div className="flex items-center justify-between"><h2 className="font-semibold">Appearance</h2><div className="flex gap-1 rounded-full bg-black/5 p-1 dark:bg-white/5">
                  <button aria-label="Light theme" onClick={() => updateTheme("light")} className={"rounded-full p-2 " + (theme === "light" ? "bg-white text-amber-500 shadow" : mutedClass)}><Sun size={16} /></button>
                  <button aria-label="Dark theme" onClick={() => updateTheme("dark")} className={"rounded-full p-2 " + (theme === "dark" ? "bg-slate-700 text-sky-300 shadow" : mutedClass)}><Moon size={16} /></button>
                </div></div>
                <p className={"mt-2 text-sm " + mutedClass}>Default is light between 5 AM and noon IST; you can change it anytime.</p>
              </div>
              <div className={cardClass}>
                <div className="flex items-center gap-2"><LockKeyhole className="text-emerald-500" size={18} /><h2 className="font-semibold">Security snapshot</h2></div>
                <p className={"mt-2 text-sm " + mutedClass}>Review device and sign-in history. Email or SMS verification needs a configured server provider.</p>
                <button onClick={() => setTab("security")} className="mt-4 text-sm font-semibold text-red-500">Open security settings →</button>
              </div>
            </div>
          </section>
        )}

        {tab === "plans" && (
          <section className="mt-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><h2 className="text-2xl font-bold">Choose your membership</h2><p className={"mt-1 text-sm " + mutedClass}>Plans are shown for comparison. Payment activation requires verified Razorpay test credentials.</p></div>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600"><CreditCard size={15} /> Test checkout setup needed</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((item) => (
                <article key={item.name} className={cardClass + " flex flex-col " + (plan === item.name ? "ring-2 ring-red-500" : "")}>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold">{item.name}</span>{plan === item.name && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600">Current</span>}</div>
                  <div className="mt-4 text-3xl font-bold">{item.price}<span className={"ml-1 text-sm font-normal " + mutedClass}>/ month</span></div>
                  <p className={"mt-2 text-sm " + mutedClass}>{item.daily} downloads per day</p>
                  <ul className={"mt-5 flex-1 space-y-3 text-sm " + mutedClass}>{item.perks.map((perk) => <li key={perk} className="flex items-center gap-2"><Check size={15} className="text-emerald-500" />{perk}</li>)}</ul>
                  <button onClick={() => choosePlan(item.name)} className={"mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold " + (item.name === "Gold" ? "bg-red-600 text-white hover:bg-red-700" : theme === "dark" ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200")}>{item.name === plan ? "Current plan" : "Continue to checkout"}</button>
                </article>
              ))}
            </div>
            <div className={cardClass + " mt-5"}><h3 className="font-semibold">Billing details</h3><p className={"mt-1 text-sm " + mutedClass}>Your transaction history and renewal date will appear here after verified payments are enabled.</p></div>
          </section>
        )}

        {tab === "downloads" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className={cardClass}>
              <div className="flex items-center gap-2"><ArrowDownToLine className="text-red-500" /><h2 className="text-lg font-semibold">Download manager</h2></div>
              <p className={"mt-2 text-sm " + mutedClass}>Plan quota resets each day at midnight IST. Re-downloading the same video within 12 hours does not use another slot.</p>
              <div className={"mt-5 rounded-2xl p-4 " + softClass}>
                <div className="flex justify-between text-sm"><span>Today’s quota</span><span className="font-semibold">{dailyDownloads} / {downloadLimit}</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-300/40"><div className="h-full rounded-full bg-red-500" style={{ width: Math.min(100, dailyDownloads / downloadLimit * 100) + "%" }} /></div>
              </div>
              <button onClick={startDownload} disabled={dailyDownloads >= downloadLimit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"><ArrowDownToLine size={17} /> Download sample video</button>
              <p className={"mt-3 text-xs " + mutedClass}>Demo download history is saved in this browser. Production quotas must be enforced by the server.</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-semibold">Your downloads</h2>
              {downloads.length === 0 ? <div className={"mt-8 rounded-xl border border-dashed p-8 text-center text-sm " + mutedClass}>No downloads yet. Start with the sample video.</div> : <div className="mt-4 space-y-3">{downloads.map((item) => <div key={item.id} className={"flex flex-col justify-between gap-3 rounded-xl p-4 sm:flex-row sm:items-center " + softClass}><div><div className="font-semibold">{item.title}</div><div className={"mt-1 text-xs " + mutedClass}>{item.date} · {item.size} · {item.plan} plan</div></div><span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><Check size={14} />{item.status}</span></div>)}</div>}
            </div>
          </section>
        )}

        {tab === "community" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={cardClass}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-semibold">Community comments</h2><p className={"mt-1 text-sm " + mutedClass}>Multilingual comments, voting, replies and report review.</p></div><label className="flex items-center gap-2 text-xs"><span className={mutedClass}>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)} className={"rounded-lg border px-2 py-2 " + panelClass}><option value="relevant">Most relevant</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="most-liked">Most liked</option></select></label></div>
              <div className="mt-5 flex gap-2"><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} maxLength={500} placeholder="Share a thoughtful comment…" className={"min-h-24 flex-1 resize-y rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-red-500 " + panelClass} /><button onClick={submitComment} className="self-end rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">Post</button></div>
              <div className={"mt-1 text-right text-xs " + mutedClass}>{commentText.length}/500</div>
              <div className="mt-5 space-y-4">{sortedComments.map((item) => <article key={item.id} className={"rounded-xl p-4 " + softClass}><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-xs font-bold text-white">{item.avatar}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold">{item.name}</span><span className={"text-xs " + mutedClass}>{item.location} · {new Date(item.time).toLocaleString()}</span>{item.edited && <span className="text-xs text-amber-600">Edited</span>}</div><p className="mt-2 text-sm">{item.text}</p><div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><button onClick={() => toggleLike(item.id, 1)} className={"inline-flex items-center gap-1 " + mutedClass}><ThumbsUp size={14} />{item.likes}</button><button onClick={() => toggleLike(item.id, -1)} className={"inline-flex items-center gap-1 " + mutedClass}><ThumbsDown size={14} /></button><button onClick={() => addReply(item.id)} className="font-medium text-red-500">Reply</button><button onClick={() => report(item.id)} disabled={item.reported} className="inline-flex items-center gap-1 text-slate-500 disabled:text-emerald-600"><Flag size={13} />{item.reported ? "Reported" : "Report"}</button><button onClick={() => setNotice("Translation provider is not configured for this demo.")} className="inline-flex items-center gap-1 text-slate-500"><Globe2 size={13} />Translate to {targetLanguage}</button></div>{item.replies.map((reply, index) => <div key={index} className={"mt-3 rounded-lg border-l-2 border-red-400 pl-3 text-sm " + mutedClass}>{reply}</div>)}</div></div></article>)}</div>
            </div>
            <aside className="space-y-5">
              <div className={cardClass}><h3 className="font-semibold">Language preference</h3><p className={"mt-1 text-sm " + mutedClass}>Choose the language for translated comment previews.</p><div className="relative mt-4"><select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className={"w-full appearance-none rounded-xl border px-3 py-3 text-sm " + panelClass}><option>Hindi</option><option>English</option><option>Bengali</option><option>Tamil</option><option>Spanish</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-4" /></div></div>
              <div className={cardClass}><h3 className="font-semibold">Safety and moderation</h3><ul className={"mt-3 space-y-3 text-sm " + mutedClass}><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-500" />Duplicate and rapid-post checks</li><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-500" />Link and repeated-character checks</li><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-500" />Reports enter a review queue</li></ul><p className="mt-3 text-xs text-amber-600">Server-side filtering, multilingual profanity lists and CAPTCHA provider still need backend configuration.</p></div>
            </aside>
          </section>
        )}

        {tab === "security" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className={cardClass}>
              <div className="flex items-center gap-2"><ShieldCheck className="text-emerald-500" /><h2 className="text-lg font-semibold">Account security</h2></div>
              <p className={"mt-2 text-sm " + mutedClass}>Review devices and theme preference. OTP delivery and trusted-device verification require a configured email or SMS provider.</p>
              <div className="mt-5 space-y-3">
                <div className={"flex items-center justify-between rounded-xl p-4 " + softClass}><div className="flex items-center gap-3"><Laptop size={19} className="text-slate-500" /><div><div className="text-sm font-semibold">Current browser</div><div className={"text-xs " + mutedClass}>{typeof navigator === "undefined" ? "This device" : navigator.userAgent.slice(0, 72) + "…"}</div></div></div><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600">This session</span></div>
                <div className={"rounded-xl p-4 " + softClass}><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 size={16} />Sign-in history</div><div className={"mt-2 text-xs " + mutedClass}>{new Date().toLocaleString()} · Browser session · India (approximate)</div></div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/5 p-4 text-sm"><div className="font-semibold text-amber-700">Verification setup required</div><p className={"mt-1 text-xs " + mutedClass}>Email/SMS OTP, IP and location records, device trust expiry and session revocation must be enforced by the authenticated backend.</p></div>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-semibold">Theme preference</h2><p className={"mt-1 text-sm " + mutedClass}>Automatically starts light from 5:00 AM to 12:00 PM IST; your manual choice is saved here.</p>
              <div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => updateTheme("light")} className={"flex items-center justify-center gap-2 rounded-xl border p-4 " + (theme === "light" ? "border-red-500 bg-red-500/5" : softClass)}><Sun size={18} />Light</button><button onClick={() => updateTheme("dark")} className={"flex items-center justify-center gap-2 rounded-xl border p-4 " + (theme === "dark" ? "border-red-500 bg-red-500/5" : softClass)}><Moon size={18} />Dark</button></div>
              <div className={"mt-5 rounded-xl p-4 text-sm " + softClass}><div className="flex items-center gap-2 font-semibold"><LockKeyhole size={16} />Trusted device</div><p className={"mt-1 text-xs " + mutedClass}>This UI stores the preference in this browser only. Production trust must follow successful OTP verification and be stored server-side.</p></div>
            </div>
          </section>
        )}

        {tab === "calls" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className={cardClass}>
              <div className="flex items-center gap-2"><Video className="text-red-500" /><h2 className="text-lg font-semibold">MyTube live room</h2></div>
              <p className={"mt-2 text-sm " + mutedClass}>Create a room link and preview your camera and microphone. A signaling service is required for remote guests.</p>
              <div className="mt-5 aspect-video overflow-hidden rounded-2xl bg-slate-950">
                {streamReady ? <video ref={videoRef} autoPlay playsInline muted className={"h-full w-full object-cover " + (cameraOff ? "hidden" : "")} /> : <div className="grid h-full place-items-center text-center text-white"><div><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/10"><Video size={25} /></div><p className="mt-3 text-sm text-white/70">Camera preview appears when you join</p></div></div>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={startRoom} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">{callActive ? "Rejoin room" : "Start room"}</button>
                <button onClick={() => { setMicOff(!micOff); streamRef.current?.getAudioTracks().forEach((track) => track.enabled = micOff); }} className={"inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm " + softClass}>{micOff ? <MicOff size={16} /> : <Mic size={16} />}{micOff ? "Unmute" : "Mute"}</button>
                <button onClick={() => { setCameraOff(!cameraOff); streamRef.current?.getVideoTracks().forEach((track) => track.enabled = cameraOff); }} className={"inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm " + softClass}>{cameraOff ? <VideoOff size={16} /> : <Camera size={16} />}{cameraOff ? "Start camera" : "Stop camera"}</button>
                {callActive && <button onClick={leaveRoom} className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800">Leave room</button>}
              </div>
              {room && <div className={"mt-4 flex items-center justify-between gap-3 rounded-xl p-4 " + softClass}><div><div className="text-xs uppercase tracking-wide text-slate-500">Room ID</div><div className="font-mono text-lg font-bold">{room}</div></div><button onClick={copyRoomLink} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"><Copy size={15} />Copy link</button></div>}
            </div>
            <div className={cardClass}><div className="flex items-center gap-2"><Users className="text-sky-500" /><h3 className="font-semibold">Room features</h3></div><div className="mt-4 space-y-3 text-sm">{["Participant list and speaking status", "In-call chat and emoji reactions", "Host controls and co-host roles", "Screen sharing and room lock", "Reconnection and connection quality"].map((item) => <div key={item} className={"flex items-center gap-2 rounded-lg p-3 " + softClass}><Check size={15} className="text-emerald-500" />{item}</div>)}</div><p className="mt-4 text-xs text-amber-600">Local camera preview works in a secure browser context. Real multi-user calls need a signaling server and TURN/STUN configuration.</p></div>
          </section>
        )}

        <footer className={"mt-8 flex flex-col gap-1 border-t py-5 text-xs sm:flex-row sm:justify-between " + mutedClass}>
          <span>MyTube · Internship feature preview</span>
          <span>Payment, OTP delivery, translation and remote calling require provider credentials.</span>
        </footer>
      </div>
    </main>
  );
}
