import { Request, Response } from 'express';
import { asyncHandler } from '../../config/asyncHandler';
import Profile from '../../models/Profile.model';

export class ProfileController {
  createProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const id = req.user?.userId as string;
    const result = await Profile.create({ ...data, userId: id });
    res.status(201).json(result);
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {});

  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {});

  deleteProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {});
}
