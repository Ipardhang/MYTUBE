import express from "express";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
import {
  cancelRenewal,
  createOrder,
  downloadVideo,
  getMembership,
  getPlans,
  updatePaymentStatus,
  listDownloads,
  verifyPayment,
} from "../controllers/internship.js";

const routes = express.Router();

routes.get("/plans", getPlans);
routes.get("/:userId", verifyFirebaseToken, getMembership);
routes.post("/orders", verifyFirebaseToken, createOrder);
routes.post("/verify", verifyFirebaseToken, verifyPayment);
routes.post("/payments/status", verifyFirebaseToken, updatePaymentStatus);
routes.post("/:userId/cancel", verifyFirebaseToken, cancelRenewal);
routes.get("/downloads/:userId", verifyFirebaseToken, listDownloads);
routes.post("/downloads/:userId/:videoId", verifyFirebaseToken, downloadVideo);

export default routes;
