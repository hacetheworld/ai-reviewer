import { jsonError } from '../utils/validator.js';
import { getUserPatByGithubUserId } from '../models/userModel.js';
import { decryptText } from '../services/encryptionService.js';

// Interim auth: client sends githubUserId (NOT PAT) per request.
// WARNING: This is not secure for public deployments; anyone can spoof a user id.
export async function tenantAuth(req, res, next) {
  try {
    const githubUserId = req.header('x-github-user-id');
    if (!githubUserId) {
      return res.status(401).json(jsonError('Missing X-GitHub-User-Id'));
    }

    const patRow = await getUserPatByGithubUserId(String(githubUserId));
    if (!patRow) {
      return res.status(401).json(jsonError('Unknown GitHub user'));
    }

    const pat = decryptText(patRow.encrypted_pat);
    req.auth = {
      githubUserId: String(githubUserId),
      pat,
      username: patRow.username,
    };

    return next();
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
