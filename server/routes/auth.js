import express from "express";
import { getChannel, getSubscriptionStatus, getSubscriptions, login, toggleSubscription, updateprofile } from "../controllers/auth.js";
import { verifyFirebaseToken } from "../middleware/firebaseAuth.js";
const routes = express.Router();

routes.post("/login", verifyFirebaseToken, login);
routes.get("/subscriptions", verifyFirebaseToken, getSubscriptions);
routes.get("/:id/subscription", verifyFirebaseToken, getSubscriptionStatus);
routes.get("/:id", getChannel);
routes.post("/:id/subscribe", verifyFirebaseToken, toggleSubscription);
routes.patch("/update/:id", verifyFirebaseToken, updateprofile);
export default routes;
