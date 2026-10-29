import video from "../Modals/video.js";
import users from "../Modals/Auth.js";

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
