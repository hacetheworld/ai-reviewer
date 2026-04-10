import { jsonError, jsonSuccess, requireString } from '../utils/validator.js';
import { fetchGithubReposWithEnabled, enableRepo, disableRepo, listEnabledRepos } from '../services/repoService.js';
import { getRepoConfig, upsertRepoConfig } from '../models/configModel.js';
import { getRepoByRepoIdAndUser } from '../models/repoModel.js';

export async function getRepos(req, res) {
  try {
    const pat = req.auth?.pat;
    const githubUserId = req.auth?.githubUserId;
    if (!pat || !githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const data = await fetchGithubReposWithEnabled({ pat, githubUserId });
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function postEnableRepo(req, res) {
  try {
    const repoId = req.params?.id;
    const owner = req.body?.owner;
    const name = req.body?.name;

    const err1 = requireString(repoId, 'id');
    const err2 = requireString(owner, 'owner');
    const err3 = requireString(name, 'name');
    const err = err1 || err2 || err3;
    if (err) return res.status(400).json(jsonError(err));

    const pat = req.auth?.pat;
    const githubUserId = req.auth?.githubUserId;
    if (!pat || !githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    
    if (!webhookUrl || !webhookSecret) {
      return res.status(500).json(jsonError('WEBHOOK_URL and WEBHOOK_SECRET are required'));
    }

    const data = await enableRepo({
      repoId,
      owner,
      name,
      pat,
      webhookUrl,
      webhookSecret,
      githubUserId,
    });

    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function postDisableRepo(req, res) {
  try {
    const repoId = req.params?.id;
    const err = requireString(repoId, 'id');
    if (err) return res.status(400).json(jsonError(err));

    const githubUserId = req.auth?.githubUserId;
    if (!githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const repoRow = await getRepoByRepoIdAndUser(String(repoId), String(githubUserId));
    if (!repoRow) {
      return res.status(403).json(jsonError('Forbidden'));
    }

    const data = await disableRepo({ repoId, githubUserId: String(githubUserId) });
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function getEnabledRepos(req, res) {
  try {
    const githubUserId = req.auth?.githubUserId;
    if (!githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const data = await listEnabledRepos(String(githubUserId));
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function getRepoConfigController(req, res) {
  try {
    const repoId = req.params?.id;
    const err = requireString(repoId, 'id');
    if (err) return res.status(400).json(jsonError(err));

    const githubUserId = req.auth?.githubUserId;
    if (!githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const repoRow = await getRepoByRepoIdAndUser(String(repoId), String(githubUserId));
    if (!repoRow) {
      return res.status(403).json(jsonError('Forbidden'));
    }

    const data = await getRepoConfig(String(repoId), String(githubUserId));
    return res.json(jsonSuccess({ rules: data?.rules || '' }));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function postRepoConfigController(req, res) {
  try {
    const repoId = req.params?.id;
    const rules = req.body?.rules;

    const err1 = requireString(repoId, 'id');
    // rules can be empty string; only validate type
    const err2 = typeof rules !== 'string' ? 'rules must be a string' : null;
    const err = err1 || err2;
    if (err) return res.status(400).json(jsonError(err));

    const githubUserId = req.auth?.githubUserId;
    if (!githubUserId) {
      return res.status(401).json(jsonError('Unauthorized'));
    }

    const repoRow = await getRepoByRepoIdAndUser(String(repoId), String(githubUserId));
    if (!repoRow) {
      return res.status(403).json(jsonError('Forbidden'));
    }

    const data = await upsertRepoConfig({ repoId: String(repoId), githubUserId: String(githubUserId), rules });
    return res.json(jsonSuccess({ rules: data.rules }));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
