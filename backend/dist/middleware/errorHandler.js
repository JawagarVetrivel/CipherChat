"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const logger_js_1 = require("../utils/logger.js");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Validation error',
            details: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    logger_js_1.logger.error('Unhandled server error', { error: message });
    res.status(500).json({
        error: 'An unexpected error occurred on the server.',
    });
}
//# sourceMappingURL=errorHandler.js.map