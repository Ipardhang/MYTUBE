import video from "../Modals/video.js";
import like from "../Modals/like.js";
import users from "../Modals/Auth.js";

const ownsAccount = async (req, userId) => {
  const account = await users.findById(userId).select("email").lean();
  return Boolean(account?.email && account.email.toLowerCase() === req.auth?.email?.toLowerCase());
};

export const handlelike = async (req, res) => {
  const { userId, reaction = "like" } = req.body;
  const { videoId } = req.params;
  if (!["like", "dislike"].includes(reaction)) return res.status(400).json({ message: "Choose a valid reaction." });
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "Sign in to react to this video." });
    const existing = await like.findOne({
      viewer: userId,
      videoid: videoId,
    });
    const selectedReaction = existing?.reaction || "like";
    const clear = existing && selectedReaction === reaction;
    if (existing && clear) {
      await like.findByIdAndDelete(existing._id);
      await video.findByIdAndUpdate(videoId, { $inc: reaction === "like" ? { Like: -1 } : { Dislike: -1 } });
    } else if (existing) {
      await like.findByIdAndUpdate(existing._id, { $set: { reaction } });
      await video.findByIdAndUpdate(videoId, { $inc: selectedReaction === "like" ? { Like: -1, Dislike: 1 } : { Dislike: -1, Like: 1 } });
    } else {
      await like.create({ viewer: userId, videoid: videoId, reaction });
      await video.findByIdAndUpdate(videoId, { $inc: reaction === "like" ? { Like: 1 } : { Dislike: 1 } });
    }
    const record = await video.findById(videoId).select("Like Dislike").lean();
    return res.status(200).json({ liked: !clear && reaction === "like", disliked: !clear && reaction === "dislike", likes: record?.Like || 0, dislikes: record?.Dislike || 0 });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getVideoReaction = async (req, res) => {
  try {
    const viewer = await users.findOne({ email: req.auth?.email }).select("_id").lean();
    if (!viewer) return res.status(404).json({ message: "Account unavailable." });
    const record = await like.findOne({ viewer: viewer._id, videoid: req.params.videoId }).lean();
    return res.status(200).json({ reaction: record?.reaction || "none" });
  } catch (error) {
    console.error("Reaction lookup error:", error);
    return res.status(500).json({ message: "Could not load reaction." });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "You can only view your own liked videos." });
    const likevideo = await like
      .find({ viewer: userId, $or: [{ reaction: "like" }, { reaction: { $exists: false } }] })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
