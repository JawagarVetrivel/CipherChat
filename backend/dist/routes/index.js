"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const userRoutes_js_1 = __importDefault(require("./userRoutes.js"));
const conversationRoutes_js_1 = __importDefault(require("./conversationRoutes.js"));
const messageRoutes_js_1 = __importDefault(require("./messageRoutes.js"));
const keyRoutes_js_1 = __importDefault(require("./keyRoutes.js"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', authRoutes_js_1.default);
apiRouter.use('/users', userRoutes_js_1.default);
apiRouter.use('/conversations', conversationRoutes_js_1.default);
apiRouter.use('/messages', messageRoutes_js_1.default);
apiRouter.use('/keys', keyRoutes_js_1.default);
// Health check endpoint
apiRouter.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'cipherchat-backend',
        timestamp: new Date().toISOString(),
        e2eeReady: true,
    });
});
exports.default = apiRouter;
//# sourceMappingURL=index.js.map