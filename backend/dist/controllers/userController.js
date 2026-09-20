"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const zod_1 = require("zod");
const userService_js_1 = require("../services/userService.js");
const updateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).optional(),
    avatarUrl: zod_1.z.string().optional(),
    publicKeyFingerprint: zod_1.z.string().optional(),
});
class UserController {
    /**
     * Search users by query.
     * STRICT PRIVACY INVARIANT: Email is NEVER returned in search results.
     */
    async search(req, res, next) {
        try {
            const query = req.query.q || req.query.username || '';
            const currentUserId = req.user?.id;
            const results = await userService_js_1.userService.searchUsers(query, currentUserId);
            res.status(200).json(results);
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService_js_1.userService.getUserById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found.' });
                return;
            }
            res.status(200).json(user);
        }
        catch (err) {
            next(err);
        }
    }
    async getByUsername(req, res, next) {
        try {
            const { username } = req.params;
            const user = await userService_js_1.userService.getUserByUsername(username);
            if (!user) {
                res.status(404).json({ error: 'User not found.' });
                return;
            }
            res.status(200).json(user);
        }
        catch (err) {
            next(err);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.id;
            const validated = updateProfileSchema.parse(req.body);
            const updated = await userService_js_1.userService.updateProfile(userId, validated);
            res.status(200).json(updated);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=userController.js.map