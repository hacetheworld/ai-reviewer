import { jsonError, jsonSuccess } from '../utils/validator.js';
import { listHistory } from '../models/historyModel.js';

export async function getHistory(req, res) {
  try {
    const repoId = req.query?.repoId ? String(req.query.repoId) : null;
    const data = await listHistory(repoId);
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
