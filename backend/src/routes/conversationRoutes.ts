import { Router } from 'express';
import { conversationController } from '../controllers/conversationController.js';
import { messageController } from '../controllers/messageController.js';
import { authenticateToken, requireConversationMember } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Conversation listing & creation
router.get('/', (req, res, next) => conversationController.getConversations(req, res, next));
router.post('/direct', (req, res, next) => conversationController.createDirect(req, res, next));
router.post('/group', (req, res, next) => conversationController.createGroup(req, res, next));

// Protected conversation endpoints requiring membership
router.get('/:id', requireConversationMember('id'), (req, res, next) =>
  conversationController.getConversation(req, res, next)
);
router.post('/:id/members', requireConversationMember('id'), (req, res, next) =>
  conversationController.addMembers(req, res, next)
);
router.delete('/:id/members/:userId', requireConversationMember('id'), (req, res, next) =>
  conversationController.removeMember(req, res, next)
);
router.patch('/:id', requireConversationMember('id'), (req, res, next) =>
  conversationController.updateGroupName(req, res, next)
);
router.post('/:id/leave', requireConversationMember('id'), (req, res, next) =>
  conversationController.leaveGroup(req, res, next)
);
router.post('/:id/read', requireConversationMember('id'), (req, res, next) =>
  conversationController.markAsRead(req, res, next)
);

// Encrypted message endpoints within a conversation
router.get('/:id/messages', requireConversationMember('id'), (req, res, next) =>
  messageController.getMessages(req, res, next)
);
router.post('/:id/messages', requireConversationMember('id'), (req, res, next) => {
  req.body.conversationId = req.params.id;
  messageController.sendMessage(req, res, next);
});

export default router;
