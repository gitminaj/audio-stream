import express from 'express';
import { register } from '../controllers/agency.js';
import { upload } from '../config/file-upload.js';

const router = express.Router();

router.post('/register',upload.fields([ { name: 'agencyIdProofFile' }, { name: 'agencyLogo' } ]), register);

export default router;