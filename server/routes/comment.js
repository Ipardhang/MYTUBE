import express from "express";
import {
  deletecomment,
  editcomment,
  getallcomment,
  postcomment,
  reportcomment,
  translatecomment,
  votecomment,
} from "../controllers/comment.js";

const routes = express.Router();

routes.get("/:videoid", getallcomment);
routes.post("/postcomment", postcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
routes.patch("/:id/vote", votecomment);
routes.post("/:id/report", reportcomment);
routes.post("/:id/translate", translatecomment);

export default routes;
