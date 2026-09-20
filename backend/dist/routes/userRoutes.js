"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const keyController_js_1 = require("../controllers/keyController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
router.use(authMiddleware_js_1.authenticateToken);
router.get('/search', (req, res, next) => userController_js_1.userController.search(req, res, next));
router.get('/username/:username', (req, res, next) => userController_js_1.userController.getByUsername(req, res, next));
router.get('/:id', (req, res, next) => userController_js_1.userController.getById(req, res, next));
router.patch('/profile', (req, res, next) => userController_js_1.userController.updateProfile(req, res, next));
router.get('/:id/keys', (req, res, next) => keyController_js_1.keyController.getUserKeys(req, res, next));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map