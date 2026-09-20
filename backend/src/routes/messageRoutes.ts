import { Router } from 'express';
import { messageController } from '../controllers/messageController.js';
import { authenticateToken, requireConversationMember } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Send message to conversation
router.post('/', requireConversationMember('conversationId'), (req, res, next) =>
  messageController.sendMessage(req, res, next)
);

export default router;
