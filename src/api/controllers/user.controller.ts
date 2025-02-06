import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService';
import { asyncHandler } from '../../config/asyncHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req.body;
    const result = await this.authService.register(data);
    res.status(201).json(result);
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const data = req.body;
    const result = await this.authService.login(data);
    res.status(200).json(result);
  });

  refresh = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);
    res.status(200).json(result);
  });

  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    await this.authService.logout(userId);
    res.status(200).json({ message: 'Logged out successfully' });
  });
}
