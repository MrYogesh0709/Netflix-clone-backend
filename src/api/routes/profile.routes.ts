import express from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate } from '../middleware/validate';
import profileValidator from '../validators/profile.schema';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const profileController = new ProfileController();

router.route('/create').post(authMiddleware, validate(profileValidator), profileController.createProfile);

router
  .route('/:profileId')
  .get(authMiddleware, profileController.getProfile)
  .patch(authMiddleware, profileController.updateProfile)
  .delete(authMiddleware, profileController.deleteProfile);

export default router;
