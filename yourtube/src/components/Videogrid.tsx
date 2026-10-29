import React, { useCallback, useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const category = typeof router.query.category === "string" ? router.query.category : "All";

  const fetchvideo = useCallback(async () => {
    setloading(true);
    try {
      const res = await axiosInstance.get("/video/getall");
      const records = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.videos)
          ? res.data.videos
          : [];
      setvideo(records);
    } catch (error) {
      console.error("Could not load videos:", error);
      setvideo([]);
    } finally {
      setloading(false);
    }
  }, []);

  useEffect(() => {
    fetchvideo();
  }, [fetchvideo]);

  // const videos = [
  //   {
  //     _id: "1",
  //     videotitle: "Amazing Nature Documentary",
  //     filename: "nature-doc.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/nature-doc.mp4",
  //     filesize: "500MB",
  //     videochanel: "Nature Channel",
  //     Like: 1250,
  //     views: 45000,
  //     uploader: "nature_lover",
  //     createdAt: new Date().toISOString(),
  //   },
  //   {
  //     _id: "2",
  //     videotitle: "Cooking Tutorial: Perfect Pasta",
  //     filename: "pasta-tutorial.mp4",
  //     filetype: "video/mp4",
  //     filepath: "/videos/pasta-tutorial.mp4",
  //     filesize: "300MB",
  //     videochanel: "Chef's Kitchen",
  //     Like: 890,
  //     views: 23000,
  //     uploader: "chef_master",
  //     createdAt: new Date(Date.now() - 86400000).toISOString(),
  //   },
  // ];
  if (loading) {
    return <p className="col-span-full py-12 text-center text-gray-500">Loading videos…</p>;
  }

  if (videos.length === 0) {
    return (
      <section className="col-span-full rounded-xl border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">No videos to show yet</h2>
        <p className="mt-2 text-sm text-gray-600">
          Upload a video to your channel, or check that the API and database are running.
        </p>
        <button
          type="button"
          onClick={fetchvideo}
          className="mt-4 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Try again
        </button>
      </section>
    );
  }

  const visibleVideos = category === "All" ? videos : videos.filter((video: any) =>
    String(video.category || "Other").toLowerCase() === category.toLowerCase()
  );

  if (visibleVideos.length === 0) {
    return <p className="col-span-full py-12 text-center text-gray-500">No videos in {category}. Choose another category or upload a video.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {visibleVideos.map((video: any) => <Videocard key={video._id} video={video} />)}
    </div>
  );
};

export default Videogrid;
