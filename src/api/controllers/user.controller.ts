import { Request, Response } from 'express';
import { AuthService } from '../../services/AuthService';
import { asyncHandler } from '../../config/asyncHandler';
import { constants, isDevelopment } from '../../utils/constant';
import { ApiResponse } from '../../utils/ApiResponse';

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
    const result = await this.authService.register(data);

    this.setTokenCookie(res, 'accessToken', result.accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', result.refreshToken, constants.jwt.refreshExpiresIn);

    res.status(201).json(new ApiResponse(201, result.user, 'User register successfully'));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = req.body;
    const result = await this.authService.login(data);

    this.setTokenCookie(res, 'accessToken', result.accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', result.refreshToken, constants.jwt.refreshExpiresIn);
    res.status(200).json(new ApiResponse(200, result.user, 'User logged In'));
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.signedCookies.refreshToken;
    const result = await this.authService.refreshToken(refreshToken);

    this.setTokenCookie(res, 'accessToken', result.accessToken, constants.jwt.expiresIn);
    this.setTokenCookie(res, 'refreshToken', result.refreshToken, constants.jwt.refreshExpiresIn);
    res.status(200).json(new ApiResponse(200, {}, 'Token Refresh success'));
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.user?.userId as string;
    await this.authService.logout(id);
    res.clearCookie('accessToken', { httpOnly: true, secure: !isDevelopment, sameSite: 'strict' });
    res.clearCookie('refreshToken', { httpOnly: true, secure: !isDevelopment, sameSite: 'strict' });

    res.status(200).json(new ApiResponse(200, {}, 'Logged out successfully'));
  });
}
