import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import videos from "../Modals/video.js";
import { DownloadQuota, DownloadRecord, Payment, Subscription } from "../Modals/internship.js";

const plans = {
  Free: { monthly: 0, dailyDownloads: 1, rank: 0, premium: false },
  Bronze: { monthly: 99, dailyDownloads: 5, rank: 1, premium: true },
  Silver: { monthly: 199, dailyDownloads: 15, rank: 2, premium: true },
  Gold: { monthly: 399, dailyDownloads: 30, rank: 3, premium: true },
};
const multipliers = { monthly: 1, quarterly: 3, yearly: 12 };
const planRank = { Free: 0, Bronze: 1, Silver: 2, Gold: 3 };

const matchesAccount = async (req, userId) => {
  if (!req.auth?.email || !mongoose.Types.ObjectId.isValid(userId)) return false;
  const account = await users.findById(userId).select("email").lean();
  return Boolean(account?.email && account.email.toLowerCase() === req.auth.email.toLowerCase());
};

const getActivePlan = async (userId) => {
  const subscription = await Subscription.findOne({ userid: userId });
  if (!subscription) return { subscription: null, plan: "Free" };
  if (subscription.expiresAt && subscription.expiresAt <= new Date() && subscription.plan !== "Free") {
    subscription.status = "expired";
    subscription.plan = "Free";
    subscription.autoRenew = false;
    await subscription.save();
  }
  return { subscription, plan: subscription.plan || "Free" };
};

const dailyKey = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

const browserName = (ua = "") => {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Other";
};
const deviceName = (ua = "") => /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop";
const makeInvoiceNumber = () => "MT-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();

export const getPlans = (req, res) => {
  return res.status(200).json(Object.entries(plans).map(([name, values]) => ({
    name,
    monthlyPrice: values.monthly,
    dailyDownloadLimit: values.dailyDownloads,
    features: name === "Free"
      ? ["Standard viewing", "1 download per day", "Community comments"]
      : ["Premium video access", name === "Gold" ? "4K streaming" : "HD streaming", values.dailyDownloads + " downloads per day"],
  })));
};

export const getMembership = async (req, res) => {
  const { userId } = req.params;
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  try {
    const { subscription, plan } = await getActivePlan(userId);
    const billingHistory = await Payment.find({ userid: userId }).sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({ plan, subscription, billingHistory, dailyDownloadLimit: plans[plan].dailyDownloads });
  } catch (error) {
    console.error("Membership lookup error:", error);
    return res.status(500).json({ message: "Could not load membership." });
  }
};

export const createOrder = async (req, res) => {
  const { userId, plan, period = "monthly" } = req.body || {};
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  if (!["Bronze", "Silver", "Gold"].includes(plan) || !multipliers[period]) {
    return res.status(400).json({ message: "Choose a valid plan and billing period." });
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(503).json({ message: "Razorpay test credentials are not configured." });
  const amount = plans[plan].monthly * multipliers[period] * 100;
  const receipt = makeInvoiceNumber();
  try {
    const pending = await Payment.findOne({ userid: userId, status: "created" }).sort({ createdAt: -1 });
    if (pending) {
      if (pending.plan !== plan || pending.period !== period) return res.status(409).json({ message: "Complete or close your pending payment before choosing another plan." });
      return res.status(200).json({ keyId, orderId: pending.orderId, amount: pending.amount, currency: pending.currency, invoiceNumber: pending.invoiceNumber });
    }
    const payment = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency: "INR", receipt, notes: { userId, plan, period } }),
      signal: AbortSignal.timeout(12000),
    });
    const order = await payment.json();
    if (!payment.ok || !order.id) return res.status(502).json({ message: "Razorpay could not create an order.", detail: order.error?.description });
    await Payment.create({
      userid: userId, plan, period, orderId: order.id, invoiceNumber: receipt,
      amount, currency: "INR", status: "created",
    });
    return res.status(201).json({ keyId, orderId: order.id, amount, currency: "INR", invoiceNumber: receipt });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(502).json({ message: "Payment service is unavailable." });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { userId, orderId, status } = req.body || {};
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  if (!orderId || !["failed", "cancelled"].includes(status)) return res.status(400).json({ message: "Invalid payment status." });
  try {
    const record = await Payment.findOneAndUpdate(
      { userid: userId, orderId, status: "created" },
      { $set: { status } },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Pending payment order not found." });
    return res.status(200).json({ status: record.status });
  } catch (error) {
    console.error("Payment status error:", error);
    return res.status(500).json({ message: "Could not update payment status." });
  }
};

export const verifyPayment = async (req, res) => {
  const { userId, orderId, paymentId, signature } = req.body || {};
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  if (!orderId || !paymentId || !signature) return res.status(400).json({ message: "Payment verification details are required." });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(503).json({ message: "Razorpay test credentials are not configured." });

  try {
    const record = await Payment.findOne({ userid: userId, orderId, status: "created" });
    if (!record) return res.status(404).json({ message: "Pending payment order not found." });
    const expected = crypto.createHmac("sha256", keySecret).update(orderId + "|" + paymentId).digest("hex");
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(String(signature));
    if (expectedBuffer.length !== suppliedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      record.status = "failed";
      await record.save();
      return res.status(400).json({ message: "Payment signature verification failed." });
    }

    const paymentResponse = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
      headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64") },
      signal: AbortSignal.timeout(12000),
    });
    const gatewayPayment = await paymentResponse.json();
    if (!paymentResponse.ok || gatewayPayment.order_id !== orderId || gatewayPayment.amount !== record.amount || gatewayPayment.currency !== "INR" || gatewayPayment.status !== "captured") {
      return res.status(402).json({ message: "The payment is not captured or does not match this order." });
    }

    record.paymentId = paymentId;
    record.status = "paid";
    record.verifiedAt = new Date();
    await record.save();

    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMonth(expiresAt.getMonth() + multipliers[record.period]);
    const subscription = await Subscription.findOneAndUpdate(
      { userid: userId },
      {
        $set: {
          plan: record.plan, period: record.period, status: "active",
          startedAt, expiresAt, autoRenew: false, nextRenewalAt: expiresAt,
        },
        $addToSet: { billingHistory: record._id },
        $setOnInsert: { userid: userId },
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (process.env.RECEIPT_EMAIL_API_URL && process.env.RECEIPT_EMAIL_API_KEY) {
      const account = await users.findById(userId).select("email name").lean();
      if (account?.email) {
        try {
          await fetch(process.env.RECEIPT_EMAIL_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.RECEIPT_EMAIL_API_KEY },
            body: JSON.stringify({
              to: account.email, subject: "MyTube subscription receipt",
              text: "Plan: " + record.plan + "\\nInvoice: " + record.invoiceNumber + "\\nAmount: INR " + (record.amount / 100) + "\\nValid until: " + expiresAt.toISOString(),
            }),
          });
        } catch (emailError) {
          console.warn("Receipt email could not be sent:", emailError.message);
        }
      }
    }
    return res.status(200).json({ verified: true, subscription, invoiceNumber: record.invoiceNumber });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ message: "Could not verify payment." });
  }
};

export const cancelRenewal = async (req, res) => {
  const { userId } = req.params;
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  try {
    const { subscription } = await getActivePlan(userId);
    if (!subscription || subscription.plan === "Free") return res.status(404).json({ message: "No paid membership to cancel." });
    subscription.autoRenew = false;
    subscription.status = "cancelled";
    await subscription.save();
    return res.status(200).json({ subscription, accessUntil: subscription.expiresAt });
  } catch (error) {
    console.error("Cancel renewal error:", error);
    return res.status(500).json({ message: "Could not cancel renewal." });
  }
};

export const listDownloads = async (req, res) => {
  const { userId } = req.params;
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  try {
    const { plan } = await getActivePlan(userId);
    const quota = await DownloadQuota.findOne({ userid: userId, dayKey: dailyKey() }).lean();
    const records = await DownloadRecord.find({ userid: userId }).sort({ downloadedAt: -1 }).limit(100).lean();
    return res.status(200).json({
      records, plan, limit: plans[plan].dailyDownloads,
      remaining: Math.max(0, plans[plan].dailyDownloads - (quota?.count || 0)),
      resetsAt: "00:00 Asia/Kolkata",
    });
  } catch (error) {
    console.error("Download history error:", error);
    return res.status(500).json({ message: "Could not load download history." });
  }
};

export const downloadVideo = async (req, res) => {
  const { userId, videoId } = req.params;
  if (!(await matchesAccount(req, userId))) return res.status(403).json({ message: "Account access denied." });
  if (!mongoose.Types.ObjectId.isValid(videoId)) return res.status(400).json({ message: "Invalid video." });

  try {
    const file = await videos.findById(videoId).lean();
    if (!file) return res.status(404).json({ message: "Video unavailable." });
    const { plan } = await getActivePlan(userId);
    const requiredPlan = file.minimumPlan || (file.isPremium ? "Bronze" : "Free");
    if ((planRank[plan] ?? 0) < (planRank[requiredPlan] ?? 99)) return res.status(403).json({ message: "This video requires a " + requiredPlan + " plan." });

    const uploadRoot = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(process.cwd(), file.filepath || "");
    if (!filePath.startsWith(uploadRoot + path.sep)) return res.status(400).json({ message: "Video file path is invalid." });
    await fs.access(filePath);

    const now = new Date();
    const cutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    let record = await DownloadRecord.findOne({ userid: userId, videoid: videoId, downloadedAt: { $gte: cutoff } });
    let countQuota = false;
    if (!record) {
      const key = dailyKey();
      const limit = plans[plan].dailyDownloads;
      let quota = await DownloadQuota.findOneAndUpdate(
        { userid: userId, dayKey: key, count: { $lt: limit } },
        { $inc: { count: 1 } },
        { new: true }
      );
      if (!quota) {
        try {
          quota = await DownloadQuota.create({ userid: userId, dayKey: key, count: 1 });
        } catch (error) {
          if (error.code === 11000) return res.status(429).json({ message: "Daily download quota reached.", limit, plan });
          throw error;
        }
      }
      countQuota = true;
      try {
        record = await DownloadRecord.create({
          userid: userId, videoid: videoId, videotitle: file.videotitle,
          thumbnail: "", status: "started", filesize: String(file.filesize || "Unknown"),
          plan, ipAddress: req.ip || "", device: deviceName(req.headers["user-agent"] || ""),
          browser: browserName(req.headers["user-agent"] || ""), dailyKey: key,
        });
      } catch (error) {
        if (countQuota) await DownloadQuota.updateOne({ userid: userId, dayKey: key }, { $inc: { count: -1 } });
        if (error.code === 11000) {
          record = await DownloadRecord.findOne({ userid: userId, videoid: videoId, dailyKey: key });
        } else throw error;
      }
    }
    if (!record) return res.status(500).json({ message: "Could not record download." });
    record.status = "started";
    await record.save();
    let finished = false;
    const complete = async (status) => {
      if (finished) return;
      finished = true;
      await DownloadRecord.updateOne({ _id: record._id }, { $set: { status } });
    };
    res.on("finish", () => { void complete("completed"); });
    res.on("close", () => { if (!res.writableEnded) void complete("interrupted"); });
    return res.download(filePath, path.basename(file.filename || file.filepath), (error) => {
      if (error) {
        void complete("failed");
        if (!res.headersSent) res.status(500).json({ message: "Download failed." });
      }
    });
  } catch (error) {
    console.error("Download authorization error:", error);
    return res.status(500).json({ message: "Could not authorize this download." });
  }
};
