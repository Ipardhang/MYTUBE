import mongoose from "mongoose";
const videochema = mongoose.Schema(
  {
    videotitle: { type: String, required: true },
    description: { type: String, default: "", maxlength: 5000 },
    category: { type: String, default: "Other", trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    filename: { type: String, required: true },
    filetype: { type: String, required: true },
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    filesize: { type: String, required: true },
    videochanel: { type: String, required: true },
    Like: { type: Number, default: 0 },
    Dislike: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    uploader: { type: String },
    isPremium: { type: Boolean, default: false },
    minimumPlan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("videofiles", videochema);
