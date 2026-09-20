"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationController = exports.ConversationController = void 0;
const zod_1 = require("zod");
const conversationService_js_1 = require("../services/conversationService.js");
const directConvSchema = zod_1.z.object({
    participantId: zod_1.z.string().min(1),
});
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    memberIds: zod_1.z.array(zod_1.z.string()).default([]),
});
const addMembersSchema = zod_1.z.object({
    memberIds: zod_1.z.array(zod_1.z.string()).min(1),
});
const updateGroupNameSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
});
class ConversationController {
    async getConversations(req, res, next) {
        try {
            const userId = req.user.id;
            const conversations = await conversationService_js_1.conversationService.getConversationsForUser(userId);
            res.status(200).json(conversations);
        }
        catch (err) {
            next(err);
        }
    }
    async getConversation(req, res, next) {
        try {
            const { id } = req.params;
            const conversation = await conversationService_js_1.conversationService.getConversationById(id, req.user.id);
            if (!conversation) {
                res.status(404).json({ error: 'Conversation not found.' });
                return;
            }
            res.status(200).json(conversation);
        }
        catch (err) {
            next(err);
        }
    }
    async createDirect(req, res, next) {
        try {
            const currentUserId = req.user.id;
            const { participantId } = directConvSchema.parse(req.body);
            const conversation = await conversationService_js_1.conversationService.getOrCreateDirectConversation(currentUserId, participantId);
            res.status(200).json(conversation);
        }
        catch (err) {
            next(err);
        }
    }
    async createGroup(req, res, next) {
        try {
            const creatorId = req.user.id;
            const { name, description, memberIds } = createGroupSchema.parse(req.body);
            const group = await conversationService_js_1.conversationService.createGroup(creatorId, name, memberIds, description);
            res.status(201).json(group);
        }
        catch (err) {
            next(err);
        }
    }
    async addMembers(req, res, next) {
        try {
            const callerId = req.user.id;
            const { id } = req.params;
            const { memberIds } = addMembersSchema.parse(req.body);
            const updatedGroup = await conversationService_js_1.conversationService.addGroupMembers(id, callerId, memberIds);
            res.status(200).json(updatedGroup);
        }
        catch (err) {
            next(err);
        }
    }
    async removeMember(req, res, next) {
        try {
            const callerId = req.user.id;
            const { id, userId } = req.params;
            const updatedGroup = await conversationService_js_1.conversationService.removeGroupMember(id, callerId, userId);
            res.status(200).json(updatedGroup);
        }
        catch (err) {
            next(err);
        }
    }
    async updateGroupName(req, res, next) {
        try {
            const callerId = req.user.id;
            const { id } = req.params;
            const { name } = updateGroupNameSchema.parse(req.body);
            const updatedGroup = await conversationService_js_1.conversationService.updateGroupName(id, callerId, name);
            res.status(200).json(updatedGroup);
        }
        catch (err) {
            next(err);
        }
    }
    async leaveGroup(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await conversationService_js_1.conversationService.leaveGroup(id, userId);
            res.status(200).json({ success: true, message: 'Successfully left the group.' });
        }
        catch (err) {
            next(err);
        }
    }
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await conversationService_js_1.conversationService.markAsRead(id, userId);
            res.status(200).json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ConversationController = ConversationController;
exports.conversationController = new ConversationController();
//# sourceMappingURL=conversationController.js.map