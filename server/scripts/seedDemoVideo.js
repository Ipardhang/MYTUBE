import "dotenv/config";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stat } from "node:fs/promises";
import Video from "../Modals/video.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const filename = "2025-06-25T06-09-29.296Z-vdo.mp4";
const filepath = path.resolve(scriptDirectory, "../uploads", filename);

async function seedDemoVideo() {
  if (!process.env.DB_URL) {
    throw new Error("DB_URL is missing. Add your MongoDB URI to server/.env first.");
  }

  const fileInfo = await stat(filepath);
  await mongoose.connect(process.env.DB_URL);

  const record = await Video.findOneAndUpdate(
    { filepath },
    {
      $setOnInsert: {
        videotitle: "Welcome to MyTube — sample clip",
        filename: "vdo.mp4",
        filepath,
        filetype: "video/mp4",
        filesize: String(fileInfo.size),
        videochanel: "MyTube Demo Channel",
        uploader: "",
        isPremium: false,
        minimumPlan: "Free",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Demo video is ready: ${record.videotitle}`);
}

seedDemoVideo()
  .catch((error) => {
    console.error("Could not seed the demo video:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
