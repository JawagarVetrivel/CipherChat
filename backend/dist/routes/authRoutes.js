"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const rateLimiter_js_1 = require("../middleware/rateLimiter.js");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_js_1.authRateLimiter, (req, res, next) => authController_js_1.authController.register(req, res, next));
router.post('/login', rateLimiter_js_1.authRateLimiter, (req, res, next) => authController_js_1.authController.login(req, res, next));
router.get('/me', authMiddleware_js_1.authenticateToken, (req, res) => authController_js_1.authController.getMe(req, res));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map