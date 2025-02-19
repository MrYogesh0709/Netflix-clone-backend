import { Request, Response } from 'express';
import { AuthService } from '../../services/AuthService';
import { asyncHandler } from '../../utils/asyncHandler';
import { constants, isDevelopment } from '../../utils/constant';
import { ApiResponse } from '../../utils/ApiResponse';
import { logger } from '../../utils/logger';
import User from '../../models/User.model';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }
  private setTokenCookie(res: Response, tokenName: string, tokenValue: string, expiresIn: number): void {
    res.cookie(tokenName, tokenValue, {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: 'strict',
      signed: true,
      maxAge: expiresIn * 1000,
      expires: new Date(Date.now() + expiresIn * 1000),
    });
  }

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const { user, refreshToken, accessToken } = await this.authService.register(data);
    logger.info(`crate user started :${user.id}`);
    this.setTokenCookie(res, 'accessToken', accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', refreshToken, constants.jwt.refreshExpiresIn);

    logger.info(`User created successfully :${user.id}`);

    res.status(201).json(new ApiResponse(201, user, 'User register successfully'));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { profiles, user, accessToken, refreshToken } = await this.authService.login(req.body);

    this.setTokenCookie(res, 'accessToken', accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', refreshToken, constants.jwt.refreshExpiresIn);

    logger.info(`User logged in:${user.id}`);

    res.status(200).json(new ApiResponse(200, { profiles, user }, 'User logged In'));
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.signedCookies.refreshToken;
    const { accessToken, refreshToken } = await this.authService.refreshToken(token);

    this.setTokenCookie(res, 'accessToken', accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', refreshToken, constants.jwt.refreshExpiresIn);
    res.status(200).json(new ApiResponse(200, {}, 'Token Refresh success'));
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.user?.userId as string;
    await this.authService.logout(id);
    res.clearCookie('accessToken', { httpOnly: true, secure: !isDevelopment, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: !isDevelopment, sameSite: 'strict' });

    logger.info(`user logged out:${id}`);
    res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
  });
}
