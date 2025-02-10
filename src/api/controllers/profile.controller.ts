import { Request, Response } from 'express';
import { asyncHandler } from '../../config/asyncHandler';
import Profile from '../../models/Profile.model';
import { Types } from 'mongoose';

export class ProfileController {
  createProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const id = req.user?.userId as string;
    const result = await Profile.create({ ...data, userId: id });
    res.status(201).json(result);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { profileId } = req.params;
    if (!Types.ObjectId.isValid(profileId?.toString() as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
        errors: ['User ID must be a valid MongoDB ObjectId'],
        data: null,
      });
      return;
    }
    const result = await Profile.findOne({ _id: profileId });
    if (!result) {
      res.status(200).json({ message: 'profile not found' });
      return;
    }
    res.status(200).json(result);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {});

  deleteProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {});
}
