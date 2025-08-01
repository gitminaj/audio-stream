import express from "express";
import { register, login, sendOTP, getSingleUser, getUsers, deleteUser, updateProfile } from "../controllers/auth.js"
import { upload } from "../config/file-upload.js";

const router = express.Router();

router.post("/register", upload.single("profile"), register);
router.put("/profile/:id",upload.single("profileImage"), updateProfile);
router.post("/login", login)
router.post("/sendotp", sendOTP)
router.get("/users", getUsers)
router.get("/profile/:id", getSingleUser)
router.delete("/delete/:id", deleteUser)

export default router;