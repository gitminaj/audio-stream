import express from 'express';
import { getAgency, getAllAgency, register, updateStatus } from '../controllers/agency.js';
import { upload } from '../config/file-upload.js';
import { authenticateJWT, superAdminOnly } from '../middleware/verify-token.js';

const router = express.Router();

router.post('/register',upload.fields([ { name: 'agencyIdProofFile' }, { name: 'agencyLogo' } ]), authenticateJWT, register);
router.put('/updateStatus/:id', superAdminOnly, updateStatus);
router.get('/getAllAgencys', superAdminOnly, getAllAgency);
router.get('/getAgency/:id', superAdminOnly, getAgency);

export default router;