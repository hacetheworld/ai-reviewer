import { jsonError, jsonSuccess, requireString } from '../utils/validator.js';
import { fetchGithubReposWithEnabled, enableRepo, disableRepo, listEnabledRepos } from '../services/repoService.js';
import { decryptText } from '../services/encryptionService.js';
import { supabase } from '../db/client.js';
import { getRepoConfig, upsertRepoConfig } from '../models/configModel.js';

async function getLatestPat() {
  const { data, error } = await supabase
    .from('user_pat')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('No PAT configured');
    err.status = 400;
    throw err;
  }
  return decryptText(data.encrypted_pat);
}

async function getLatestUserRow() {
  const { data, error } = await supabase
    .from('user_pat')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error('No PAT configured');
    err.status = 400;
    throw err;
  }
  return data;
}

export async function getRepos(req, res) {
  try {
    const pat = await getLatestPat();
    const data = await fetchGithubReposWithEnabled(pat);
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

    const userRow = await getLatestUserRow();
    const pat = decryptText(userRow.encrypted_pat);

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
      githubUserId: userRow.github_user_id,
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

    const data = await disableRepo({ repoId });
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}

export async function getEnabledRepos(req, res) {
  try {
    const data = await listEnabledRepos();
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

    const data = await getRepoConfig(repoId);
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

    const data = await upsertRepoConfig({ repoId, rules });
    return res.json(jsonSuccess({ rules: data.rules }));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
