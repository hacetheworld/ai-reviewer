import { requireString, jsonError, jsonSuccess } from '../utils/validator.js';
import { savePat } from '../services/authService.js';

export async function postPat(req, res) {
  try {
    const pat = req.body?.pat;
    const err = requireString(pat, 'pat');
    if (err) return res.status(400).json(jsonError(err));

    const data = await savePat(pat);
    return res.json(jsonSuccess(data));
  } catch (e) {
    const status = e?.status || 500;
    return res.status(status).json(jsonError(e?.message || 'Server error'));
  }
}
