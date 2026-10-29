import watchlater from "../Modals/watchlater.js";
import users from "../Modals/Auth.js";

const ownsAccount = async (req, userId) => {
  const account = await users.findById(userId).select("email").lean();
  return Boolean(account?.email && account.email.toLowerCase() === req.auth?.email?.toLowerCase());
};

export const handlewatchlater = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "Sign in to manage Watch later." });
    const exisitingwatchlater = await watchlater.findOne({
      viewer: userId,
      videoid: videoId,
    });
    if (exisitingwatchlater) {
      await watchlater.findByIdAndDelete(exisitingwatchlater._id);
      return res.status(200).json({ watchlater: false });
    } else {
      await watchlater.create({ viewer: userId, videoid: videoId });
      return res.status(200).json({ watchlater: true });
    }
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallwatchlater = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!(await ownsAccount(req, userId))) return res.status(403).json({ message: "You can only view your own Watch later playlist." });
    const watchlatervideo = await watchlater
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(watchlatervideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removeWatchLater = async (req, res) => {
  try {
    const entry = await watchlater.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ message: "Saved video not found." });
    if (!(await ownsAccount(req, entry.viewer))) return res.status(403).json({ message: "You can only edit your own Watch later playlist." });
    await entry.deleteOne();
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error("Watch later removal error:", error);
    return res.status(500).json({ message: "Could not remove saved video." });
  }
};
