"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageController = exports.MessageController = void 0;
const zod_1 = require("zod");
const messageService_js_1 = require("../services/messageService.js");
const sendMessageSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    conversationId: zod_1.z.string().min(1),
    ciphertext: zod_1.z.string().min(1),
    header: zod_1.z.record(zod_1.z.unknown()).default({}),
    timestamp: zod_1.z.string().optional(),
});
class MessageController {
    async getMessages(req, res, next) {
        try {
            const { id } = req.params;
            const messages = await messageService_js_1.messageService.getMessagesForConversation(id);
            res.status(200).json(messages);
        }
        catch (err) {
            next(err);
        }
    }
    async sendMessage(req, res, next) {
        try {
            const senderId = req.user.id;
            const validated = sendMessageSchema.parse(req.body);
            const storedMessage = await messageService_js_1.messageService.storeEncryptedMessage({
                id: validated.id,
                conversationId: validated.conversationId,
                senderId,
                ciphertext: validated.ciphertext,
                header: validated.header,
                timestamp: validated.timestamp,
            });
            res.status(201).json(storedMessage);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MessageController = MessageController;
exports.messageController = new MessageController();
//# sourceMappingURL=messageController.js.map