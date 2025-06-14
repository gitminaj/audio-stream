import express from "express";
import { authenticateJWT } from "../middleware/verify-token.js";
import { createRoom,getRoomCount,deleteRoom } from "../controllers/chat-room.js";

const router = express.Router();

router.post("/create", authenticateJWT, createRoom)
router.get("/count", authenticateJWT, getRoomCount)
router.delete("/delete/:roomId", authenticateJWT, deleteRoom)


export default router;