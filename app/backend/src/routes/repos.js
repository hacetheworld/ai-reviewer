import { Router } from 'express';
import {
	getRepos,
	postEnableRepo,
	postDisableRepo,
	getEnabledRepos,
	getRepoConfigController,
	postRepoConfigController,
} from '../controllers/repoController.js';

const router = Router();

router.get('/', getRepos);
router.get('/enabled', getEnabledRepos);
router.get('/:id/config', getRepoConfigController);
router.post('/:id/config', postRepoConfigController);
router.post('/:id/enable', postEnableRepo);
router.post('/:id/disable', postDisableRepo);

export default router;
