import "dotenv/config";
import mongoose from "mongoose";
import { ensureDemoVideo } from "../utils/ensureDemoVideo.js";

async function seedDemoVideo() {
  if (!process.env.DB_URL) {
    throw new Error("DB_URL is missing. Add your MongoDB URI to server/.env first.");
  }

  await mongoose.connect(process.env.DB_URL);
  const record = await ensureDemoVideo({ onlyWhenEmpty: false });
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
