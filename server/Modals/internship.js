import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true, index: true },
    plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    period: { type: String, enum: ["monthly", "quarterly", "yearly"], default: "monthly" },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    autoRenew: { type: Boolean, default: false },
    nextRenewalAt: { type: Date, default: null },
    billingHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "mytubePayment" }],
  },
  { timestamps: true }
);

const paymentSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    plan: { type: String, enum: ["Bronze", "Silver", "Gold"], required: true },
    period: { type: String, enum: ["monthly", "quarterly", "yearly"], required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, default: "" },
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed", "cancelled"], default: "created" },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const quotaSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    dayKey: { type: String, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);
quotaSchema.index({ userid: 1, dayKey: 1 }, { unique: true });

const downloadSchema = new mongoose.Schema(
  {
    userid: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    videoid: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles", required: true },
    videotitle: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    downloadedAt: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ["started", "completed", "interrupted", "failed"], default: "started" },
    filesize: { type: String, default: "Unknown" },
    plan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
    ipAddress: { type: String, default: "" },
    device: { type: String, default: "" },
    browser: { type: String, default: "" },
    dailyKey: { type: String, required: true },
  },
  { timestamps: true }
);
downloadSchema.index({ userid: 1, videoid: 1, dailyKey: 1 }, { unique: true });

export const Subscription = mongoose.models.mytubeSubscription || mongoose.model("mytubeSubscription", subscriptionSchema);
export const Payment = mongoose.models.mytubePayment || mongoose.model("mytubePayment", paymentSchema);
export const DownloadQuota = mongoose.models.mytubeDownloadQuota || mongoose.model("mytubeDownloadQuota", quotaSchema);
export const DownloadRecord = mongoose.models.mytubeDownload || mongoose.model("mytubeDownload", downloadSchema);
