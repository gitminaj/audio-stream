import express from 'express';
import { createPost, deletePostById, getAllPostByUserId, updatePost } from '../controllers/post.js';
import { authenticateJWT } from '../middleware/verify-token.js';
import { upload } from '../config/file-upload.js';

const router = express.Router();

router.post('/create-post', authenticateJWT , upload.single('postUrl'), createPost);
router.get('/get-usersPosts', authenticateJWT , getAllPostByUserId);
router.delete('/delete/:id', authenticateJWT , deletePostById);
router.put("/update/:id", authenticateJWT, upload.single("postUrl"), updatePost);

export default router;