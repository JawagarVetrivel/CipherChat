"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3001),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    SUPABASE_URL: zod_1.z.string().optional().default(''),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().optional().default(''),
    JWT_SECRET: zod_1.z.string().default('cipherchat_default_jwt_secret_dev_key_change_me_32chars'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000), // 15 mins
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map