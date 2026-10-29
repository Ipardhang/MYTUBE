import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import internshiproutes from "./routes/internship.js";
import { randomBytes } from "node:crypto";
import { ensureDemoVideo } from "./utils/ensureDemoVideo.js";
dotenv.config();

// A local-only signing key keeps the demo player usable without extra setup.
// Hosted environments must provide a stable secret so tokens remain valid
// across restarts and across multiple server instances.
if (!process.env.VIDEO_STREAM_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("VIDEO_STREAM_SECRET is required in production.");
  }
  process.env.VIDEO_STREAM_SECRET = randomBytes(32).toString("hex");
  console.warn("VIDEO_STREAM_SECRET is missing; using a temporary development secret.");
}

const app = express();
app.set("trust proxy", 1);
const allowedOrigins = (process.env.APP_ORIGINS || "http://localhost:3000")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== "production"
      && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/membership", internshiproutes);
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(async () => {
    console.log("Mongodb connected");
    if (process.env.AUTO_SEED_DEMO !== "false") {
      try {
        const seeded = await ensureDemoVideo();
        if (seeded) console.log("Added the bundled sample video to the empty database.");
      } catch (error) {
        console.error("Could not seed the bundled sample video:", error.message);
      }
    }
  })
  .catch((error) => {
    console.log(error);
  });
