"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_js_1 = require("../controllers/messageController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateToken);
// Send message to conversation
router.post('/', (0, authMiddleware_js_1.requireConversationMember)('conversationId'), (req, res, next) => messageController_js_1.messageController.sendMessage(req, res, next));
exports.default = router;
//# sourceMappingURL=messageRoutes.js.map