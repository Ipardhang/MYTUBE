import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    reason: { type: String, enum: ["spam", "harassment", "offensive", "misinformation", "other"], required: true },
    reportedon: { type: Date, default: Date.now },
  },
  { _id: false }
);

const editSchema = new mongoose.Schema(
  {
    body: { type: String, required: true },
    editedon: { type: Date, default: Date.now },
  },
  { _id: false }
);

const moderationSchema = new mongoose.Schema(
  {
    moderatorEmail: { type: String, required: true },
    action: { type: String, enum: ["visible", "held"], required: true },
    note: { type: String, default: "" },
    moderatedon: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentschema = mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    videoid: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles", required: true, index: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "comment", default: null, index: true },
    commentbody: { type: String, required: true, maxlength: 1000 },
    usercommented: { type: String, required: true, maxlength: 80 },
    userimage: { type: String, default: "" },
    location: { type: String, default: "" },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    reports: [reportSchema],
    moderationHistory: [moderationSchema],
    editHistory: [editSchema],
    edited: { type: Boolean, default: false },
    editedon: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ["visible", "held"], default: "visible", index: true },
  },
  { timestamps: true }
);

commentschema.index({ videoid: 1, commentedon: -1 });
commentschema.index({ userid: 1, videoid: 1, commentedon: -1 });

export default mongoose.models.comment || mongoose.model("comment", commentschema);
