import express from 'express';
import { validate } from '../middleware/validate';
import { UserSchemaLogin, UserSchemaRegister } from '../validators/user.schema';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';
import { authLimiterMiddleware } from '../middleware/rateLimiterMiddleware';

const router = express.Router();
const authController = new AuthController();

router.route('/register').post(authLimiterMiddleware, validate(UserSchemaRegister), authController.register);
router.route('/login').post(authLimiterMiddleware, validate(UserSchemaLogin), authController.login);
router.route('/refresh').post(authController.refresh);
router.route('/logout').get(authMiddleware, authController.logout);

export default router;
