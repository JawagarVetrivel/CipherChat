"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_js_1 = require("./config/env.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const app = (0, express_1.default)();
app.disable('x-powered-by');
// Security Headers
app.use((0, helmet_1.default)());
// CORS Configuration
const allowedOrigins = [
    env_js_1.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin)
            return callback(null, true);
        // Check if origin matches allowed list or vercel preview deploys
        if (allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app') ||
            origin.endsWith('.onrender.com')) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body Parsing
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Global API rate limiting
app.use('/api', rateLimiter_js_1.apiRateLimiter);
// Mount API routes
app.use('/api', index_js_1.default);
// Root health probe for Render / Cloud monitors
app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'online',
        app: 'CipherChat Secure E2EE Dumb-Pipe Relay',
        version: '1.0.0',
        documentation: 'See README.md for protocol specification.',
    });
});
// Centralized error handling
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map