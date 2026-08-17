import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getConversationsOverview } from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversationsOverview);

export default router;
