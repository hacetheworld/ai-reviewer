import { Router } from 'express';
import { postGithubWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/github', postGithubWebhook);

export default router;
