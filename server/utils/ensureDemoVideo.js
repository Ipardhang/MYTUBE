import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Video from "../Modals/video.js";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const bundledVideo = path.resolve(moduleDirectory, "../../yourtube/public/video/vdo.mp4");

export async function ensureDemoVideo({ onlyWhenEmpty = true } = {}) {
  if (onlyWhenEmpty && await Video.exists({})) return null;

  const uploadsDirectory = path.resolve(process.cwd(), "uploads");
  const filename = "mytube-demo.mp4";
  const filepath = path.join(uploadsDirectory, filename);
  await fs.mkdir(uploadsDirectory, { recursive: true });
  try {
    await fs.access(filepath);
  } catch {
    await fs.copyFile(bundledVideo, filepath);
  }
  const fileInfo = await fs.stat(filepath);

  return Video.findOneAndUpdate(
    { filepath },
    {
      $setOnInsert: {
        videotitle: "Welcome to MyTube — sample clip",
        filename,
        filepath,
        filetype: "video/mp4",
        filesize: String(fileInfo.size),
        videochanel: "MyTube Demo Channel",
        uploader: "",
        isPremium: false,
        minimumPlan: "Free",
      },
      $set: {
        description: "A short sample clip included with MyTube to verify video playback, history, and player controls.",
        category: "Education",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
