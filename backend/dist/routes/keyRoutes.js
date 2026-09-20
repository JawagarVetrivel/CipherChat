"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const keyController_js_1 = require("../controllers/keyController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateToken);
router.post('/', (req, res, next) => keyController_js_1.keyController.registerKey(req, res, next));
router.get('/user/:id', (req, res, next) => keyController_js_1.keyController.getUserKeys(req, res, next));
exports.default = router;
//# sourceMappingURL=keyRoutes.js.map