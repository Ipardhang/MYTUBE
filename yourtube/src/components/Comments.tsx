import React, { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Flag, Globe2, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  userimage?: string;
  location?: string;
  commentedon: string;
  parentComment?: string | { _id: string } | null;
  likedBy?: string[];
  dislikedBy?: string[];
  edited?: boolean;
  editedon?: string;
  deleted?: boolean;
  reports?: { reporter: string; reason: string }[];
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const parentId = (comment: Comment) => typeof comment.parentComment === "object" ? comment.parentComment?._id : comment.parentComment;

const Comments = ({ videoId }: any) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const { user } = useUser();

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get("/comment/" + videoId);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setNotice("Comments could not load. Check the server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) loadComments();
  }, [videoId]);

  const sortedRoots = useMemo(() => {
    const roots = comments.filter((item) => !parentId(item));
    return [...roots].sort((a, b) => {
      if (sort === "oldest") return new Date(a.commentedon).getTime() - new Date(b.commentedon).getTime();
      if (sort === "most-liked") return (b.likedBy?.length || 0) - (a.likedBy?.length || 0);
      return new Date(b.commentedon).getTime() - new Date(a.commentedon).getTime();
    });
  }, [comments, sort]);

  const checkComment = (text: string) => {
    const value = text.trim();
    if (value.length < 3 || value.length > 1000) return "Comments must be between 3 and 1000 characters.";
    if (/(https?:\/\/|www\.)/i.test(value)) return "Links are not allowed in comments.";
    if (/(.)\1{7,}/u.test(value)) return "Please avoid repeated characters.";
    if (comments.some((item) => !item.deleted && item.commentbody.trim().toLowerCase() === value.toLowerCase())) return "This comment has already been posted.";
    return "";
  };

  const handleSubmit = async (text: string, parentComment?: string) => {
    if (!user) { setNotice("Sign in to join the conversation."); return; }
    const validation = checkComment(text);
    if (validation) { setNotice(validation); return; }
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: text.trim(),
        usercommented: user.name || "Viewer",
        userimage: user.image || "",
        parentComment: parentComment || null,
        captchaAnswer: captchaAnswer || undefined,
      });
      const created = response.data?.comment;
      if (created) setComments((prev) => [created, ...prev]);
      const times = JSON.parse(localStorage.getItem("mytube-comment-times") || "[]").filter((time: number) => Date.now() - time < 60_000);
      localStorage.setItem("mytube-comment-times", JSON.stringify([...times, Date.now()]));
      setNewComment("");
      setReplyText("");
      setCaptchaQuestion("");
      setCaptchaAnswer("");
      setReplyingTo(null);
      setNotice("Comment posted.");
    } catch (error: any) {
      if (error?.response?.data?.captchaRequired) {
        try {
          const captcha = await axiosInstance.get("/comment/captcha");
          setCaptchaQuestion(captcha.data.question);
          setCaptchaAnswer("");
        } catch { setNotice("Could not load the comment check."); }
      }
      setNotice(error?.response?.data?.message || "Comment could not be posted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: Comment) => {
    if (Date.now() - new Date(item.commentedon).getTime() > EDIT_WINDOW_MS) {
      setNotice("The 15-minute edit window has expired.");
      return;
    }
    setEditingCommentId(item._id);
    setEditText(item.commentbody);
  };

  const handleUpdateComment = async () => {
    const validation = checkComment(editText);
    if (validation && editText.trim() !== comments.find((item) => item._id === editingCommentId)?.commentbody) {
      setNotice(validation);
      return;
    }
    try {
      await axiosInstance.post("/comment/editcomment/" + editingCommentId, { commentbody: editText.trim(), userid: user?._id });
      setComments((prev) => prev.map((item) => item._id === editingCommentId ? { ...item, commentbody: editText.trim(), edited: true, editedon: new Date().toISOString() } : item));
      setEditingCommentId(null);
      setEditText("");
      setNotice("Comment updated.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Comment could not be updated.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await axiosInstance.delete("/comment/deletecomment/" + id, { data: { userid: user._id } });
      setComments((prev) => prev.map((item) => item._id === id ? { ...item, commentbody: "[comment deleted]", deleted: true } : item));
      setNotice("Comment deleted. Replies are preserved.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Comment could not be deleted.");
    }
  };

  const handleVote = async (item: Comment, vote: "like" | "dislike") => {
    if (!user) { setNotice("Sign in to vote on comments."); return; }
    const current = item.likedBy?.includes(user._id) ? "like" : item.dislikedBy?.includes(user._id) ? "dislike" : "";
    const nextVote = current === vote ? "clear" : vote;
    try {
      const response = await axiosInstance.patch("/comment/" + item._id + "/vote", { userid: user._id, vote: nextVote });
      setComments((prev) => prev.map((entry) => {
        if (entry._id !== item._id) return entry;
        const likedBy = (entry.likedBy || []).filter((id) => id !== user._id);
        const dislikedBy = (entry.dislikedBy || []).filter((id) => id !== user._id);
        if (nextVote === "like") likedBy.push(user._id);
        if (nextVote === "dislike") dislikedBy.push(user._id);
        return { ...entry, likedBy, dislikedBy };
      }));
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Vote could not be saved.");
    }
  };

  const handleReport = async (item: Comment) => {
    if (!user) { setNotice("Sign in to report a comment."); return; }
    const choice = window.prompt("Report reason: spam, harassment, offensive, misinformation, or other", "spam");
    if (!choice) return;
    const reason = choice.toLowerCase().trim();
    try {
      await axiosInstance.post("/comment/" + item._id + "/report", { userid: user._id, reason });
      setNotice("Report sent for administrator review.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Report could not be submitted.");
    }
  };

  const handleTranslate = async (item: Comment) => {
    if (translations[item._id]) {
      setTranslations((previous) => { const next = { ...previous }; delete next[item._id]; return next; });
      return;
    }
    try {
      const response = await axiosInstance.post("/comment/" + item._id + "/translate", { target: targetLanguage });
      setTranslations((previous) => ({ ...previous, [item._id]: response.data.translatedText }));
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Translation is unavailable.");
    }
  };

  const canEdit = (item: Comment) => user && String(item.userid) === String(user._id) && !item.deleted && Date.now() - new Date(item.commentedon).getTime() <= EDIT_WINDOW_MS;
  const displayComment = (item: Comment) => item.deleted ? "[comment deleted]" : translations[item._id] || item.commentbody;

  const renderComment = (item: Comment, isReply = false) => (
    <article key={item._id} className={"flex gap-3 " + (isReply ? "ml-10 mt-4 border-l-2 border-gray-200 pl-4" : "border-b pb-5")}>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={item.userimage || ""} />
        <AvatarFallback>{item.usercommented?.[0] || "U"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{item.usercommented || "Viewer"}</span>
          {item.location && <span className="text-xs text-gray-400">{item.location}</span>}
          <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(item.commentedon), { addSuffix: true })}</span>
          {item.edited && <span className="text-xs text-gray-400">Edited</span>}
        </div>
        {editingCommentId === item._id ? (
          <div className="mt-2 space-y-2">
            <Textarea value={editText} maxLength={1000} onChange={(event) => setEditText(event.target.value)} />
            <div className="flex justify-end gap-2"><Button onClick={handleUpdateComment}>Save</Button><Button variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button></div>
          </div>
        ) : <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-800">{displayComment(item)}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <button onClick={() => handleVote(item, "like")} className={"inline-flex items-center gap-1 " + (item.likedBy?.includes(user?._id) ? "text-red-600" : "")}><ThumbsUp size={14} />{item.likedBy?.length || 0}</button>
          <button onClick={() => handleVote(item, "dislike")} className={"inline-flex items-center gap-1 " + (item.dislikedBy?.includes(user?._id) ? "text-red-600" : "")}><ThumbsDown size={14} />{item.dislikedBy?.length || 0}</button>
          {!item.deleted && <button onClick={() => { setReplyingTo(item._id); setReplyText(""); }} className="font-medium hover:text-black">Reply</button>}
          {!item.deleted && <button onClick={() => void handleTranslate(item)} className="inline-flex items-center gap-1 hover:text-black"><Globe2 size={13} />{translations[item._id] ? "Original" : "Translate"}</button>}
          {!item.deleted && <button onClick={() => void handleReport(item)} className="inline-flex items-center gap-1 hover:text-black"><Flag size={13} />Report</button>}
          {canEdit(item) && <button onClick={() => handleEdit(item)} className="hover:text-black">Edit</button>}
          {user && String(item.userid) === String(user._id) && !item.deleted && <button onClick={() => void handleDelete(item._id)} className="hover:text-black">Delete</button>}
        </div>
        {replyingTo === item._id && (
          <div className="mt-3 space-y-2">
            {captchaQuestion && <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><span>Quick check: {captchaQuestion}</span><input aria-label="CAPTCHA answer" inputMode="numeric" value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} className="w-16 rounded border bg-white px-2 py-1 text-center" /></div>}
            <Textarea value={replyText} maxLength={1000} placeholder={"Reply to " + item.usercommented + "…"} onChange={(event) => setReplyText(event.target.value)} />
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button><Button onClick={() => void handleSubmit(replyText, item._id)} disabled={isSubmitting || !replyText.trim()}>Reply</Button></div>
          </div>
        )}
        {comments.filter((entry) => parentId(entry) === item._id).map((reply) => renderComment(reply, true))}
      </div>
    </article>
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><MessageCircle size={20} />{comments.length} Comments</h2>
        <label className="flex items-center gap-2 text-sm text-gray-600"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border bg-white px-2 py-1.5"><option value="relevant">Most relevant</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="most-liked">Most liked</option></select></label>
      </div>
      {notice && <div role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</div>}
      {user && <div className="flex gap-3">
        <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={user.image || ""} /><AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          {captchaQuestion && <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><span>Quick check: {captchaQuestion}</span><input aria-label="CAPTCHA answer" inputMode="numeric" value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} className="w-16 rounded border bg-white px-2 py-1 text-center" /></div>}
          <Textarea placeholder="Add a comment…" value={newComment} maxLength={1000} onChange={(event) => setNewComment(event.target.value)} className="min-h-20 resize-y" />
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-gray-400">{newComment.length}/1000 · Links and repeated characters are filtered</span><div className="flex gap-2"><Button variant="ghost" onClick={() => setNewComment("")} disabled={!newComment}>Cancel</Button><Button onClick={() => void handleSubmit(newComment)} disabled={!newComment.trim() || isSubmitting}>{isSubmitting ? "Posting…" : "Comment"}</Button></div></div>
        </div>
      </div>}
      {!user && <p className="text-sm text-gray-500">Sign in to comment, reply, or report.</p>}
      <div className="space-y-5">
        {loading ? <p className="text-sm text-gray-500">Loading comments…</p> : sortedRoots.length === 0 ? <p className="text-sm italic text-gray-500">No comments yet. Be the first to comment.</p> : sortedRoots.map((item) => renderComment(item))}
      </div>
    </section>
  );
};

export default Comments;
