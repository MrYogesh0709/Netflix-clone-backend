import express from 'express';
import { validate } from '../middleware/validate';
import { UserSchemaLogin, UserSchemaRegister } from '../validators/user.schema';
import { AuthController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const authController = new AuthController();

router.route('/register').post(validate(UserSchemaRegister), authController.register);
router.route('/login').post(validate(UserSchemaLogin), authController.login);
router.route('/refresh').post(authController.refresh);
router.route('/logout').get(authMiddleware, authController.logout);

export default router;
