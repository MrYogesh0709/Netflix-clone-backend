import { asyncHandler } from '../../config/asyncHandler';
import { Request, Response } from 'express';

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ message: 'User registered  successfully!' });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ message: 'User login successfully!' });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ message: 'hello brother' });
});
