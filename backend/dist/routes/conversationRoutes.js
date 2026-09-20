"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationController_js_1 = require("../controllers/conversationController.js");
const messageController_js_1 = require("../controllers/messageController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateToken);
// Conversation listing & creation
router.get('/', (req, res, next) => conversationController_js_1.conversationController.getConversations(req, res, next));
router.post('/direct', (req, res, next) => conversationController_js_1.conversationController.createDirect(req, res, next));
router.post('/group', (req, res, next) => conversationController_js_1.conversationController.createGroup(req, res, next));
// Protected conversation endpoints requiring membership
router.get('/:id', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.getConversation(req, res, next));
router.post('/:id/members', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.addMembers(req, res, next));
router.delete('/:id/members/:userId', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.removeMember(req, res, next));
router.patch('/:id', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.updateGroupName(req, res, next));
router.post('/:id/leave', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.leaveGroup(req, res, next));
router.post('/:id/read', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => conversationController_js_1.conversationController.markAsRead(req, res, next));
// Encrypted message endpoints within a conversation
router.get('/:id/messages', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => messageController_js_1.messageController.getMessages(req, res, next));
router.post('/:id/messages', (0, authMiddleware_js_1.requireConversationMember)('id'), (req, res, next) => {
    req.body.conversationId = req.params.id;
    messageController_js_1.messageController.sendMessage(req, res, next);
});
exports.default = router;
//# sourceMappingURL=conversationRoutes.js.map