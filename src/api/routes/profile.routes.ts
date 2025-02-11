import express from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { validate } from '../middleware/validate';
import { authMiddleware } from '../middleware/authMiddleware';
import { profileValidator, updateProfileValidator } from '../validators/profile.schema';

const router = express.Router();
const profileController = new ProfileController();

router.route('/create').post(authMiddleware, validate(profileValidator), profileController.createProfile);

router
  .route('/:profileId')
  .get(authMiddleware, profileController.getProfile)
  .patch(authMiddleware, validate(updateProfileValidator), profileController.updateProfile)
  .delete(authMiddleware, profileController.deleteProfile);

router.route('').get(authMiddleware, profileController.getUserProfile);
export default router;
