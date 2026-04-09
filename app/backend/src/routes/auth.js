import { Router } from 'express';
import { postPat } from '../controllers/authController.js';

const router = Router();

router.post('/pat', postPat);

export default router;
