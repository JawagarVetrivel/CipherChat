import { Router } from 'express';
import { keyController } from '../controllers/keyController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', (req, res, next) => keyController.registerKey(req, res, next));
router.get('/user/:id', (req, res, next) => keyController.getUserKeys(req, res, next));

export default router;
