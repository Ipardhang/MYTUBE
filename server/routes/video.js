import express from "express";
import { createStreamToken, getallvideo, streamVideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const routes = express.Router();

routes.post("/upload", verifyFirebaseToken, upload.single("file"), uploadvideo);
routes.get("/stream-token/:id", createStreamToken);
routes.get("/stream/:id", streamVideo);
routes.get("/getall", getallvideo);
export default routes;
