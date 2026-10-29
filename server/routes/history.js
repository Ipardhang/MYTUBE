import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
  removeHistoryEntry,
  clearHistory,
} from "../controllers/history.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const routes = express.Router();
routes.get("/:userId", verifyFirebaseToken, getallhistoryVideo);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", verifyFirebaseToken, handlehistory);
routes.delete("/entry/:entryId", verifyFirebaseToken, removeHistoryEntry);
routes.delete("/clear/:userId", verifyFirebaseToken, clearHistory);
export default routes;
