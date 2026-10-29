import express from "express";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
import {
  createCommentCaptcha,
  deletecomment,
  editcomment,
  getReportedComments,
  getallcomment,
  moderateComment,
  postcomment,
  reportcomment,
  translatecomment,
  votecomment,
} from "../controllers/comment.js";

const routes = express.Router();

routes.get("/captcha", verifyFirebaseToken, createCommentCaptcha);
routes.get("/moderation/reports", verifyFirebaseToken, getReportedComments);
routes.patch("/:id/moderation", verifyFirebaseToken, moderateComment);
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", verifyFirebaseToken, postcomment);
routes.delete("/deletecomment/:id", verifyFirebaseToken, deletecomment);
routes.post("/editcomment/:id", verifyFirebaseToken, editcomment);
routes.patch("/:id/vote", verifyFirebaseToken, votecomment);
routes.post("/:id/report", verifyFirebaseToken, reportcomment);
routes.post("/:id/translate", translatecomment);

export default routes;
