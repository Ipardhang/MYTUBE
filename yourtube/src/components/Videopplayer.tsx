"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Captions, Maximize, Minimize, Pause, PictureInPicture2, Play, Settings2, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

const speeds = [0.5, 1, 1.25, 1.5, 2];
const timeLabel = (value: number) => {
  if (!Number.isFinite(value)) return "0:00";
  const seconds = Math.max(0, Math.floor(value));
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
};

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [theater, setTheater] = useState(false);
  const [visible, setVisible] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "";
  const source = video?.filepath
    ? (/^https?:\/\//i.test(video.filepath) ? video.filepath : backend.replace(/\/$/, "") + "/" + video.filepath.replace(/^\//, ""))
    : "/video/vdo.mp4";
  const progressKey = "mytube-progress-" + video?._id;

  const showControls = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setVisible(false), 2800);
    }
  }, [playing]);

  const togglePlay = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      window.dispatchEvent(new CustomEvent("mytube-play-video", { detail: video?._id }));
      void element.play().catch(() => setBuffering(false));
    } else {
      element.pause();
    }
    showControls();
  }, [showControls, video?._id]);

  const seek = useCallback((amount: number) => {
    const element = videoRef.current;
    if (element) element.currentTime = Math.min(duration, Math.max(0, element.currentTime + amount));
    showControls();
  }, [duration, showControls]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    const saved = Number(localStorage.getItem(progressKey) || 0);
    const restore = () => {
      setDuration(element.duration || 0);
      if (saved > 0 && saved < (element.duration || 0) - 5) {
        element.currentTime = saved;
        setCurrent(saved);
      }
    };
    const update = () => {
      setCurrent(element.currentTime);
      if (element.currentTime > 0 && element.duration) localStorage.setItem(progressKey, String(element.currentTime));
      if (element.duration && element.currentTime / element.duration >= 0.9) {
        localStorage.setItem("mytube-completed-" + video._id, "true");
      }
    };
    const onOtherPlay = (event: Event) => {
      const custom = event as CustomEvent<string>;
      if (custom.detail !== video?._id) element.pause();
    };
    element.addEventListener("loadedmetadata", restore);
    element.addEventListener("timeupdate", update);
    window.addEventListener("mytube-play-video", onOtherPlay);
    return () => {
      element.removeEventListener("loadedmetadata", restore);
      element.removeEventListener("timeupdate", update);
      window.removeEventListener("mytube-play-video", onOtherPlay);
    };
  }, [video?._id, progressKey]);

  useEffect(() => {
    const element = videoRef.current;
    if (element) {
      element.volume = volume;
      element.muted = muted;
      element.playbackRate = speed;
      Array.from(element.textTracks).forEach((track) => track.mode = captions ? "showing" : "hidden");
    }
  }, [volume, muted, speed, captions]);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
    if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); togglePlay(); }
    if (event.key === "ArrowLeft") { event.preventDefault(); seek(event.shiftKey ? -30 : -10); }
    if (event.key === "ArrowRight") { event.preventDefault(); seek(event.shiftKey ? 30 : 10); }
    if (event.key === "ArrowUp") { event.preventDefault(); setVolume((value) => Math.min(1, value + 0.05)); }
    if (event.key === "ArrowDown") { event.preventDefault(); setVolume((value) => Math.max(0, value - 0.05)); }
    if (event.key.toLowerCase() === "m") setMuted((value) => !value);
    if (event.key.toLowerCase() === "t") setTheater((value) => !value);
    if (event.key.toLowerCase() === "c") setCaptions((value) => !value);
    if (event.key.toLowerCase() === "f") void toggleFullscreen();
    showControls();
  };

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await wrapper.requestFullscreen?.();
    showControls();
  };

  const togglePip = async () => {
    const element = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<PictureInPictureWindow> }) | null;
    if (!element) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await element.requestPictureInPicture?.();
    } catch { /* PiP is not available in every browser. */ }
  };

  const nextSpeed = () => {
    const index = speeds.indexOf(speed);
    setSpeed(speeds[(index + 1) % speeds.length]);
    showControls();
  };

  return (
    <div ref={wrapperRef} tabIndex={0} onKeyDown={onKeyDown} onMouseMove={showControls} onMouseLeave={() => playing && setVisible(false)} className={"group relative aspect-video overflow-hidden rounded-xl bg-black outline-none " + (theater ? "w-full" : "")}>
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        preload="metadata"
        onPlay={() => { setPlaying(true); setBuffering(false); showControls(); }}
        onPause={() => { setPlaying(false); setVisible(true); }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onClick={togglePlay}
        playsInline
      >
        <source src={source} type="video/mp4" />
        <track kind="captions" srcLang="en" label="English captions" src="/captions/sample.vtt" />
        Your browser does not support the video tag.
      </video>
      {buffering && <div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" /></div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />
      <div className={"absolute inset-x-0 bottom-0 p-3 text-white transition-opacity sm:p-4 " + (visible ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span>{timeLabel(current)}</span>
          <input aria-label="Seek video" type="range" min={0} max={duration || 1} step="0.1" value={Math.min(current, duration || 0)} onChange={(event) => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); }} className="h-1 min-w-0 flex-1 cursor-pointer accent-red-500" />
          <span>-{timeLabel(Math.max(0, duration - current))}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="rounded p-1 hover:bg-white/15">{playing ? <Pause size={20} /> : <Play size={20} />}</button>
          <button aria-label="Back 10 seconds" onClick={() => seek(-10)} className="hidden rounded px-1 text-xs hover:bg-white/15 sm:inline">−10</button>
          <button aria-label="Forward 10 seconds" onClick={() => seek(10)} className="hidden rounded px-1 text-xs hover:bg-white/15 sm:inline">+10</button>
          <button aria-label={muted ? "Unmute" : "Mute"} onClick={() => setMuted(!muted)} className="rounded p-1 hover:bg-white/15">{muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
          <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => { setVolume(Number(event.target.value)); setMuted(false); }} className="hidden w-20 accent-white sm:block" />
          <span className="hidden text-xs text-white/80 md:inline">{video?.videotitle}</span>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button title="Playback speed" onClick={nextSpeed} className="rounded px-2 py-1 text-xs hover:bg-white/15">{speed}×</button>
            <button title="Quality: Auto" onClick={() => setQuality(quality === "Auto" ? "HD" : "Auto")} className="hidden items-center gap-1 rounded px-2 py-1 text-xs hover:bg-white/15 sm:inline-flex"><Settings2 size={14} />{quality}</button>
            <button aria-label="Captions" title="Captions (C)" onClick={() => setCaptions(!captions)} className={"rounded p-1 hover:bg-white/15 " + (captions ? "text-red-300" : "")}><Captions size={18} /></button>
            <button aria-label="Picture in picture" title="Picture in picture (P)" onClick={togglePip} className="rounded p-1 hover:bg-white/15"><PictureInPicture2 size={17} /></button>
            <button aria-label="Theater mode" title="Theater mode (T)" onClick={() => setTheater(!theater)} className="hidden rounded p-1 hover:bg-white/15 sm:block">{theater ? <Minimize size={17} /> : <Maximize size={17} />}</button>
            <button aria-label="Fullscreen" title="Fullscreen (F)" onClick={() => void toggleFullscreen()} className="rounded p-1 hover:bg-white/15"><Maximize size={18} /></button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/80">MyTube Player</div>
    </div>
  );
}
