import video from "../Modals/video.js";
import users from "../Modals/Auth.js";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import { Subscription } from "../Modals/internship.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const owner = await users.findById(req.body.uploader).select("email").lean();
      if (!owner || owner.email?.toLowerCase() !== req.auth?.email?.toLowerCase()) {
        return res.status(403).json({ message: "You can only upload to your own channel." });
      }
      const isPremium = req.body.isPremium === "true";
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path,
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
        isPremium,
        minimumPlan: isPremium ? req.body.minimumPlan || "Bronze" : "Free",
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


const rank = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };
const requiredPlan = (record) =>
  record.minimumPlan && record.minimumPlan !== "Free"
    ? record.minimumPlan
    : record.isPremium ? "Bronze" : "Free";

const checkedFilePath = async (record) => {
  const root = path.resolve(process.cwd(), "uploads");
  const filename = path.resolve(process.cwd(), record.filepath || "");
  if (!filename.startsWith(root + path.sep)) throw new Error("Invalid video path");
  await fs.access(filename);
  return filename;
};

export const createStreamToken = async (req, res) => {
  const { id } = req.params;
  if (!process.env.VIDEO_STREAM_SECRET) return res.status(503).json({ message: "Video streaming is not configured." });
  try {
    const record = await video.findById(id);
    if (!record) return res.status(404).json({ message: "Video unavailable." });
    const needed = requiredPlan(record);
    let claims = { videoId: String(record._id), plan: "Free" };

    if ((rank[needed] ?? 99) > 0) {
      let authenticated = false;
      await verifyFirebaseToken(req, res, () => { authenticated = true; });
      if (!authenticated) return;
      const owner = await users.findOne({ email: req.auth.email }).select("_id").lean();
      if (!owner) return res.status(403).json({ message: "Account is unavailable." });
      const subscription = await Subscription.findOne({ userid: owner._id }).lean();
      const activePlan = subscription?.expiresAt && new Date(subscription.expiresAt) > new Date()
        ? subscription.plan : "Free";
      if ((rank[activePlan] ?? 0) < (rank[needed] ?? 99)) {
        return res.status(403).json({ message: "This video requires a " + needed + " membership." });
      }
      claims = { ...claims, userId: String(owner._id), plan: activePlan };
    }

    const token = jwt.sign(claims, process.env.VIDEO_STREAM_SECRET, { expiresIn: "3m" });
    return res.status(200).json({ url: "/video/stream/" + record._id + "?token=" + encodeURIComponent(token), expiresIn: 180 });
  } catch (error) {
    console.error("Stream token error:", error);
    return res.status(500).json({ message: "Could not authorize video playback." });
  }
};

export const streamVideo = async (req, res) => {
  const { id } = req.params;
  const secret = process.env.VIDEO_STREAM_SECRET;
  if (!secret) return res.status(503).json({ message: "Video streaming is not configured." });
  try {
    const claims = jwt.verify(String(req.query.token || ""), secret);
    if (typeof claims === "string" || claims.videoId !== id) return res.status(401).json({ message: "Invalid video access token." });
    const record = await video.findById(id);
    if (!record) return res.status(404).json({ message: "Video unavailable." });
    const needed = requiredPlan(record);
    if ((rank[needed] ?? 99) > 0) {
      if (!claims.userId) return res.status(403).json({ message: "Membership required." });
      const subscription = await Subscription.findOne({ userid: claims.userId }).lean();
      const activePlan = subscription?.expiresAt && new Date(subscription.expiresAt) > new Date()
        ? subscription.plan : "Free";
      if ((rank[activePlan] ?? 0) < (rank[needed] ?? 99)) {
        return res.status(403).json({ message: "Membership expired or insufficient." });
      }
    }
    const filename = await checkedFilePath(record);
    res.setHeader("Cache-Control", "private, no-store");
    res.type(record.filetype || "video/mp4");
    return res.sendFile(filename, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).end();
    });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Video access expired. Reload the player." });
    }
    console.error("Video stream error:", error);
    return res.status(500).json({ message: "Could not stream video." });
  }
};
