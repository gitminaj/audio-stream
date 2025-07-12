import express from "express";
import { login, register } from "../controllers/superAdmin.js";
import { upload } from "../config/file-upload.js";

const router = express.Router();

router.post("/register", upload.single("profile"), register);
router.post('/login',login);

export default router;
