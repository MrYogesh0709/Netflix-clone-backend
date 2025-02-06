import express from 'express';
import { loginUser, logoutUser, registerUser } from '../controllers/user.controller';
import { validate } from '../middleware/validate';
import { UserSchema } from '../validators/user.schema';

const router = express.Router();

router.route('/register').post(validate(UserSchema), registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

export default router;
