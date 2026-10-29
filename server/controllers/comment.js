import comment from "../Modals/comment.js";
import mongoose from "mongoose";

const postWindows = new Map();
const EDIT_WINDOW_MS = 15 * 60 * 1000;

const cleanText = (value) => String(value || "").replace(/[<>]/g, "").trim();
const normalized = (value) => cleanText(value).toLocaleLowerCase().replace(/\s+/g, " ");
const hasRepeatedCharacters = (value) => /(.)\1{7,}/u.test(value);
const emojiOrPunctuationOnly = (value) => /^[\p{Emoji}\p{P}\s]+$/u.test(value);
const configuredTerms = () => (process.env.PROFANITY_TERMS || "")
  .split(",").map((term) => term.trim().toLocaleLowerCase()).filter(Boolean);

const validateBody = (body) => {
  if (body.length < 3 || body.length > 1000) return "Comments must be between 3 and 1000 characters.";
  if (/(https?:\/\/|www\.)/i.test(body)) return "Links are not allowed in comments.";
  if (hasRepeatedCharacters(body) || emojiOrPunctuationOnly(body)) return "Please avoid repeated characters or emoji-only comments.";
  if (configuredTerms().some((term) => term && normalized(body).includes(term))) return "Your comment needs editing before it can be posted.";
  return null;
};

export const postcomment = async (req, res) => {
  const { videoid, userid, usercommented, userimage, parentComment } = req.body;
  const commentbody = cleanText(req.body.commentbody);
  if (!mongoose.Types.ObjectId.isValid(videoid) || !mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "A valid user and video are required." });
  }
  const validation = validateBody(commentbody);
  if (validation) return res.status(400).json({ message: validation });

  const key = String(userid);
  const now = Date.now();
  const recent = (postWindows.get(key) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return res.status(429).json({ message: "Too many comments. Try again in a minute.", captchaRequired: true });
  if (parentComment && !mongoose.Types.ObjectId.isValid(parentComment)) {
    return res.status(400).json({ message: "Reply target is invalid." });
  }

  try {
    if (parentComment) {
      const parent = await comment.findOne({ _id: parentComment, videoid, moderationStatus: "visible" });
      if (!parent) return res.status(404).json({ message: "Reply target is unavailable." });
    }
    const recentComments = await comment.find({
      userid, videoid, commentedon: { $gte: new Date(now - 10 * 60_000) }, deleted: false,
    }).select("commentbody").lean();
    if (recentComments.some((item) => normalized(item.commentbody) === normalized(commentbody))) {
      return res.status(409).json({ message: "You already posted this comment recently." });
    }

    const record = await comment.create({
      videoid, userid, usercommented: cleanText(usercommented).slice(0, 80) || "Viewer",
      userimage: cleanText(userimage).slice(0, 500), parentComment: parentComment || null,
      commentbody, moderationStatus: "visible",
    });
    postWindows.set(key, [...recent, now]);
    return res.status(201).json({ comment: record });
  } catch (error) {
    console.error("Comment post error:", error);
    return res.status(500).json({ message: "Could not post comment." });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoid)) return res.status(400).json({ message: "Invalid video." });
  try {
    const comments = await comment.find({ videoid, moderationStatus: "visible" }).sort({ commentedon: -1 }).lean();
    const mode = req.query.sort;
    if (mode === "oldest") comments.sort((a, b) => new Date(a.commentedon) - new Date(b.commentedon));
    if (mode === "most-liked" || mode === "relevant") comments.sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Comment fetch error:", error);
    return res.status(500).json({ message: "Could not load comments." });
  }
};

export const deletecomment = async (req, res) => {
  const { id } = req.params;
  const userid = req.body?.userid || req.query?.userid;
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "A valid comment and owner are required." });
  }
  try {
    const record = await comment.findById(id);
    if (!record) return res.status(404).json({ message: "Comment unavailable." });
    if (String(record.userid) !== String(userid)) return res.status(403).json({ message: "You can only delete your own comment." });
    record.deleted = true;
    record.commentbody = "[comment deleted]";
    await record.save();
    return res.status(200).json({ comment: record });
  } catch (error) {
    console.error("Comment delete error:", error);
    return res.status(500).json({ message: "Could not delete comment." });
  }
};

export const editcomment = async (req, res) => {
  const { id } = req.params;
  const userid = req.body?.userid;
  const commentbody = cleanText(req.body?.commentbody);
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userid)) {
    return res.status(400).json({ message: "A valid comment and owner are required." });
  }
  const validation = validateBody(commentbody);
  if (validation) return res.status(400).json({ message: validation });
  try {
    const record = await comment.findById(id);
    if (!record || record.deleted) return res.status(404).json({ message: "Comment unavailable." });
    if (String(record.userid) !== String(userid)) return res.status(403).json({ message: "You can only edit your own comment." });
    if (Date.now() - new Date(record.commentedon).getTime() > EDIT_WINDOW_MS) {
      return res.status(403).json({ message: "The 15-minute edit window has expired." });
    }
    record.editHistory.push({ body: record.commentbody });
    record.commentbody = commentbody;
    record.edited = true;
    record.editedon = new Date();
    await record.save();
    return res.status(200).json(record);
  } catch (error) {
    console.error("Comment edit error:", error);
    return res.status(500).json({ message: "Could not edit comment." });
  }
};

export const votecomment = async (req, res) => {
  const { id } = req.params;
  const { userid, vote } = req.body || {};
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userid) || !["like", "dislike", "clear"].includes(vote)) {
    return res.status(400).json({ message: "Invalid vote." });
  }
  try {
    const record = await comment.findById(id);
    if (!record || record.deleted) return res.status(404).json({ message: "Comment unavailable." });
    record.likedBy = record.likedBy.filter((user) => String(user) !== String(userid));
    record.dislikedBy = record.dislikedBy.filter((user) => String(user) !== String(userid));
    if (vote === "like") record.likedBy.push(userid);
    if (vote === "dislike") record.dislikedBy.push(userid);
    await record.save();
    return res.status(200).json({ likes: record.likedBy.length, dislikes: record.dislikedBy.length, vote });
  } catch (error) {
    console.error("Comment vote error:", error);
    return res.status(500).json({ message: "Could not save vote." });
  }
};

export const reportcomment = async (req, res) => {
  const { id } = req.params;
  const { userid, reason } = req.body || {};
  const allowed = ["spam", "harassment", "offensive", "misinformation", "other"];
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userid) || !allowed.includes(reason)) {
    return res.status(400).json({ message: "Choose a valid report reason." });
  }
  try {
    const record = await comment.findById(id);
    if (!record || record.deleted) return res.status(404).json({ message: "Comment unavailable." });
    if (record.reports.some((report) => String(report.reporter) === String(userid))) {
      return res.status(409).json({ message: "You already reported this comment." });
    }
    record.reports.push({ reporter: userid, reason });
    await record.save();
    return res.status(202).json({ reported: true, reports: record.reports.length });
  } catch (error) {
    console.error("Comment report error:", error);
    return res.status(500).json({ message: "Could not submit report." });
  }
};

export const translatecomment = async (req, res) => {
  const { id } = req.params;
  const target = String(req.body?.target || "").slice(0, 10);
  if (!mongoose.Types.ObjectId.isValid(id) || !/^[a-z-]{2,10}$/i.test(target)) return res.status(400).json({ message: "Invalid translation request." });
  if (!process.env.TRANSLATION_API_URL) return res.status(503).json({ message: "Translation service is not configured." });
  try {
    const record = await comment.findById(id).select("commentbody");
    if (!record || record.deleted) return res.status(404).json({ message: "Comment unavailable." });
    const response = await fetch(process.env.TRANSLATION_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: record.commentbody, source: "auto", target, format: "text" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return res.status(502).json({ message: "Translation service failed." });
    const result = await response.json();
    if (typeof result.translatedText !== "string") return res.status(502).json({ message: "Translation response was invalid." });
    return res.status(200).json({ translatedText: result.translatedText, target });
  } catch (error) {
    console.error("Translation error:", error);
    return res.status(502).json({ message: "Translation service unavailable." });
  }
};
