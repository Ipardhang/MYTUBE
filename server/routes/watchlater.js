import express from "express";
import {
  getallwatchlater,
  handlewatchlater,
  removeWatchLater,
} from "../controllers/watchlater.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const routes = express.Router();
routes.get("/:userId", verifyFirebaseToken, getallwatchlater);
routes.post("/:videoId", verifyFirebaseToken, handlewatchlater);
routes.delete("/entry/:entryId", verifyFirebaseToken, removeWatchLater);
export default routes;
