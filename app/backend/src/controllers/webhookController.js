import { jsonError, jsonSuccess } from '../utils/validator.js';
import { handleGithubWebhook } from '../services/webhookService.js';

export async function postGithubWebhook(req, res) {
  try {
    const rawBody = req.rawBody;
    const signature = req.get('x-hub-signature-256');
    const event = req.get('x-github-event');

    const data = await handleGithubWebhook({
      rawBody,
      signature,
      event,
      payload: req.body,
    });

    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
