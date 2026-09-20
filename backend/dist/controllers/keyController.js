"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyController = exports.KeyController = void 0;
const zod_1 = require("zod");
const keyService_js_1 = require("../services/keyService.js");
const registerKeySchema = zod_1.z.object({
    keyType: zod_1.z.enum(['identity', 'signed_prekey', 'one_time_prekey']),
    publicKey: zod_1.z.string().min(1),
    expiresAt: zod_1.z.string().optional(),
});
class KeyController {
    async registerKey(req, res, next) {
        try {
            const userId = req.user.id;
            const validated = registerKeySchema.parse(req.body);
            const record = await keyService_js_1.keyService.registerPublicKey({
                userId,
                keyType: validated.keyType,
                publicKey: validated.publicKey,
                expiresAt: validated.expiresAt,
            });
            res.status(201).json(record);
        }
        catch (err) {
            next(err);
        }
    }
    async getUserKeys(req, res, next) {
        try {
            const { id } = req.params;
            const keys = await keyService_js_1.keyService.getPublicKeysForUser(id);
            res.status(200).json(keys);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.KeyController = KeyController;
exports.keyController = new KeyController();
//# sourceMappingURL=keyController.js.map