import express from 'express';
import { upload } from '../config/file-upload.js';
import { authenticateJWT } from '../middleware/verify-token.js';
import { getAllHost, register, updateStatus } from '../controllers/host.js';

const router = express.Router();

router.post('/register',upload.fields([ { name: 'hostIdProofFile' }, { name: 'hostLogo' } ]), authenticateJWT, register);
router.put('/updateStatus/:id', authenticateJWT ,updateStatus);
router.get('/getAllHost', getAllHost);
// router.get('/getAgency/:id', superAdminOnly, getAgency);

export default router;