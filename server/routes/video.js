import express from "express";
import { getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";

const routes = express.Router();

routes.post("/upload", verifyFirebaseToken, upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
export default routes;
