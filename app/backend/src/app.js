
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import repoRoutes from './routes/repos.js';
import webhookRoutes from './routes/webhook.js';
import historyRoutes from './routes/history.js';
import { jsonError } from './utils/validator.js';

const app = express();

app.use(cors());

// Capture raw body for webhook verification.
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/health', (req, res) => res.json({ success: true, data: 'ok' }));

app.use('/auth', authRoutes);
app.use('/repos', repoRoutes);
app.use('/history', historyRoutes);
app.use('/webhooks', webhookRoutes);

app.use((req, res) => {
  res.status(404).json(jsonError('Not found'));
});

export default app;
