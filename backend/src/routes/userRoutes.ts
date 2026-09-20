import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { keyController } from '../controllers/keyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/search', (req, res, next) => userController.search(req, res, next));
router.get('/username/:username', (req, res, next) => userController.getByUsername(req, res, next));
router.get('/:id', (req, res, next) => userController.getById(req, res, next));
router.patch('/profile', (req, res, next) => userController.updateProfile(req, res, next));
router.get('/:id/keys', (req, res, next) => keyController.getUserKeys(req, res, next));

export default router;
