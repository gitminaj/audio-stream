import express from 'express';
import { register, updateStatus } from '../controllers/agency.js';
import { upload } from '../config/file-upload.js';
import { authenticateJWT } from '../middleware/verify-token.js';

const router = express.Router();

router.post('/register',upload.fields([ { name: 'agencyIdProofFile' }, { name: 'agencyLogo' } ]), register);
router.post('/updateStatus/:id', authenticateJWT, updateStatus);

export default router;