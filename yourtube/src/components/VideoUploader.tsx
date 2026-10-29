import { Check, FileVideo, Upload, X } from "lucide-react";
import React, { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import axiosInstance from "@/lib/axiosinstance";

const VideoUploader = ({ channelId, channelName }: any) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Education");
  const [isPremium, setIsPremium] = useState(false);
  const [minimumPlan, setMinimumPlan] = useState("Bronze");
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const handlefilechange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== "video/mp4" || !file.name.toLowerCase().endsWith(".mp4")) {
        toast.error("Upload an MP4 video file.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File size exceeds 100MB limit.");
        return;
      }
      setVideoFile(file);
      const filename = file.name;
      if (!videoTitle) {
        setVideoTitle(filename);
      }
    }
  };
  const resetForm = () => {
    setVideoFile(null);
    setVideoTitle("");
    setDescription("");
    setCategory("Education");
    setIsPremium(false);
    setMinimumPlan("Bronze");
    setIsUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const cancelUpload = () => {
    if (isUploading) {
      abortRef.current?.abort();
      toast.info("Cancelling upload…");
    } else resetForm();
  };
  const handleUpload = async () => {
    if (!videoFile || !videoTitle.trim()) {
      toast.error("Please provide file and title");
      return;
    }
    const formdata = new FormData();
    formdata.append("file", videoFile);
    formdata.append("videotitle", videoTitle);
    formdata.append("description", description);
    formdata.append("category", category);
    formdata.append("videochanel", channelName);
    formdata.append("uploader", channelId);
    formdata.append("isPremium", String(isPremium));
    formdata.append("minimumPlan", isPremium ? minimumPlan : "Free");
    try {
      setIsUploading(true);
      setUploadProgress(0);
      abortRef.current = new AbortController();
      await axiosInstance.post("/video/upload", formdata, {
         signal: abortRef.current.signal,
         headers: {
    "Content-Type": "multipart/form-data", // ✅ MUST for FormData
  },
        onUploadProgress: (progresEvent: any) => {
          const progress = Math.round(
            (progresEvent.loaded * 100) / progresEvent.total
          );
          setUploadProgress(progress);
        },
      });
      setUploadComplete(true);
      toast.success("Video uploaded successfully.");
    } catch (error) {
      console.error("Error uploading video:", error);
      if (abortRef.current?.signal.aborted) toast.info("Upload cancelled.");
      else toast.error("There was an error uploading your video. Please try again.");
    } finally {
      abortRef.current = null;
      setIsUploading(false);
    }
  };
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Upload a video</h2>

      <div className="space-y-4">
        {!videoFile ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-lg font-medium">
              Drag and drop video files to upload
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to select files
            </p>
            <p className="text-xs text-gray-400 mt-4">
              MP4 video • Up to 100MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/mp4,.mp4"
              onChange={handlefilechange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="bg-blue-100 p-2 rounded-md">
                <FileVideo className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{videoFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={cancelUpload}>
                  <X className="w-5 h-5" />
                </Button>
              )}
              {uploadComplete && (
                <div className="bg-green-100 p-1 rounded-full">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="title">Title (required)</Label>
                <Input
                  id="title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Add a title that describes your video"
                  disabled={isUploading || uploadComplete}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea id="description" value={description} maxLength={5000} onChange={(event) => setDescription(event.target.value)} placeholder="Tell viewers what this video is about" disabled={isUploading || uploadComplete} className="mt-1 min-h-24 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select id="category" value={category} onChange={(event) => setCategory(event.target.value)} disabled={isUploading || uploadComplete} className="mt-1 block rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
                  {["Education", "Music", "Gaming", "Movies", "News", "Sports", "Technology", "Comedy", "Science", "Travel", "Food", "Fashion", "Other"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} disabled={isUploading || uploadComplete} />
                Make this video available to paid members
              </label>
              {isPremium && <label className="block text-sm">Minimum plan
                <select value={minimumPlan} onChange={(event) => setMinimumPlan(event.target.value)} disabled={isUploading || uploadComplete} className="ml-3 rounded border px-2 py-1">
                  <option value="Bronze">Bronze</option><option value="Silver">Silver</option><option value="Gold">Gold</option>
                </select>
              </label>}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!uploadComplete && (
                <>
                  <Button onClick={cancelUpload} disabled={uploadComplete}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      isUploading || !videoTitle.trim() || uploadComplete
                    }
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
