import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { Types } from 'mongoose';
import { ProfileService } from '../../services/ProfileService';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../errors/ApiErrors';
import { logger } from '../../utils/logger';
export class ProfileController {
  createProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const userId = req.user?.userId as string;
    const result = await ProfileService.createProfile({ ...data, userId });
    logger.info(`profile created : ${userId}`);
    res.status(201).json(new ApiResponse(201, result, `profile created`));
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = req.params.profileId ?? '';
    const userId = req.user?.userId as string;

    if (!Types.ObjectId.isValid(profileId)) {
      throw new ApiError(400, 'Invalid Id format', ['Profile Id must be valid MongoDB ObjectId']);
    }
    const result = await ProfileService.getProfile(profileId, userId);
    res.status(200).json(new ApiResponse(200, result));
  });

  getUserProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId as string;
    const result = await ProfileService.getUserProfiles(userId);
    res.status(200).json(new ApiResponse(200, result));
  });

  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = req.params.profileId ?? '';
    const userId = req.user?.userId as string;

    if (!Types.ObjectId.isValid(profileId)) {
      throw new ApiError(400, 'Invalid Id Format');
    }

    const result = await ProfileService.updateProfile(profileId, req.body, userId);
    logger.info(`profile updated :${profileId}`);
    res.status(200).json(new ApiResponse(200, result));
  });

  deleteProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profileId = req.params.profileId ?? '';
    const userId = req.user?.userId as string;

    if (!Types.ObjectId.isValid(profileId)) {
      throw new ApiError(400, 'Invalid Id format', ['Profile Id must be valid MongoDB ObjectId']);
    }
    const result = await ProfileService.deleteProfile(profileId, userId);
    logger.info(`profile deleted :${profileId}`);
    res.status(200).json(new ApiResponse(200, `Profile ${result.name} Deleted`));
  });
}
