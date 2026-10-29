import video from "../Modals/video.js";
import history from "../Modals/history.js";
import users from "../Modals/Auth.js";

const ownsAccount = async (req, userId) => {
  const account = await users.findById(userId).select("email").lean();
  return Boolean(account?.email && account.email.toLowerCase() === req.auth?.email?.toLowerCase());
};

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "Sign in to save watch history." });
    await history.findOneAndUpdate({ viewer: userId, videoid: videoId }, { $set: { createdAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ viewed: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "You can only view your own history." });
    const historyvideo = await history
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(historyvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeHistoryEntry = async (req, res) => {
  try {
    const entry = await history.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "History entry not found." });
    if (!(await ownsAccount(req, entry.viewer))) return res.status(403).json({ message: "You can only edit your own history." });
    await entry.deleteOne();
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error("History removal error:", error);
    return res.status(500).json({ message: "Could not remove history entry." });
  }
};

export const clearHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "You can only clear your own history." });
    await history.deleteMany({ viewer: userId });
    return res.status(200).json({ cleared: true });
  } catch (error) {
    console.error("History clear error:", error);
    return res.status(500).json({ message: "Could not clear history." });
  }
};
