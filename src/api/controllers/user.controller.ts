import { asyncHandler } from '../../config/asyncHandler';
import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { UserInput } from '../validators/user.schema';
import User from '../../models/User.model';
import { ApiError } from '../../errors/ApiErrors';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const userData: UserInput = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ApiError(400, 'Email already in use');
  }

  const newUser = await User.create(userData);
  res.status(201).json({ success: true, message: 'User registered successfully', data: newUser });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ message: 'User login successfully!' });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ message: 'hello brother' });
});
