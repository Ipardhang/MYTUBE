import express from "express";
import { handlelike, getallLikedVideo, getVideoReaction } from "../controllers/like.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const routes = express.Router();
routes.get("/status/:videoId", verifyFirebaseToken, getVideoReaction);
routes.get("/:userId", verifyFirebaseToken, getallLikedVideo);
routes.post("/:videoId", verifyFirebaseToken, handlelike);
export default routes;
