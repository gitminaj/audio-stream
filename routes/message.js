import express from "express";
import { sendDirectMessage, getMessages, sendGroupMessage, getGroupMessages } from "../controllers/message.js";
import { authenticateJWT } from "../middleware/verify-token.js";

const router = express.Router();

router.post("/send", authenticateJWT, sendDirectMessage)
router.get("/get/:senderId/:receiverId", authenticateJWT, getMessages)
router.get("/get-group/:roomId", authenticateJWT, getGroupMessages)
router.post("/group", authenticateJWT, sendGroupMessage)


export default router;