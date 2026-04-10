import { jsonError, jsonSuccess, requireString } from '../utils/validator.js';
import { listHistory } from '../models/historyModel.js';
import { getRepoByRepoIdAndUser } from '../models/repoModel.js';

export async function getHistory(req, res) {
  try {
    const githubUserId = req.auth?.githubUserId;
    if (!githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const repoId = req.query?.repoId ? String(req.query.repoId) : '';
    const err = requireString(repoId, 'repoId');
    if (err) return res.status(400).json(jsonError(err));

    const repoRow = await getRepoByRepoIdAndUser(String(repoId), String(githubUserId));
    if (!repoRow) {
      return res.status(403).json(jsonError('Forbidden'));
    }

    const data = await listHistory({ repoId, githubUserId: String(githubUserId) });
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
