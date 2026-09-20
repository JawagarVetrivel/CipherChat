"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const zod_1 = require("zod");
const authService_js_1 = require("../services/authService.js");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    username: zod_1.z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
    displayName: zod_1.z.string().optional().default(''),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
class AuthController {
    async register(req, res, next) {
        try {
            const validated = registerSchema.parse(req.body);
            const result = await authService_js_1.authService.register({
                email: validated.email,
                password: validated.password,
                username: validated.username,
                displayName: validated.displayName || validated.username,
            });
            res.status(201).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            const validated = loginSchema.parse(req.body);
            const result = await authService_js_1.authService.login(validated);
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    async getMe(req, res) {
        res.status(200).json({ user: req.user });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=authController.js.map