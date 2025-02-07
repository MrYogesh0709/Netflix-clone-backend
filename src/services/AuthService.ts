import jwt from 'jsonwebtoken';
import { comparePassword, hashPassword } from '../utils/password.util';
import { AuthResponse, AuthRequest, UserType } from '../types/auth.types';
import { constants } from '../utils/constant';
import User from '../models/User.model';
import { ApiError } from '../errors/ApiErrors';
import { JwtPayload } from '../types/express';

export class AuthService {
  private generateTokens(user: UserType): { accessToken: string; refreshToken: string } {
    const secret = constants.jwt.secret;

    const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
    const refreshTokenPayload: JwtPayload = { userId: user._id.toString() };

    const accessTokenOptions = { expiresIn: constants.jwt.expiresIn };
    const refreshTokenOptions = { expiresIn: constants.jwt.refreshExpiresIn };

    const accessToken = jwt.sign(payload, secret, accessTokenOptions);
    const refreshToken = jwt.sign(refreshTokenPayload, secret, refreshTokenOptions);

    return { accessToken, refreshToken };
  }

  async register(data: AuthRequest): Promise<AuthResponse> {
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existingUser) {
      throw new ApiError(400, 'User with this email or username already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const newUser = await User.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = this.generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return {
      accessToken,
      refreshToken,
      user: { id: newUser._id, email: newUser.email },
    };
  }

  async login(data: AuthRequest): Promise<AuthResponse> {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new ApiError(400, 'Invalid credentials');
    }

    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new ApiError(400, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, email: user.email },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = jwt.verify(token, constants.jwt.secret) as JwtPayload;
    const user = await User.findOne({ _id: decoded.userId, refreshToken: token });

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $unset: { refreshToken: 1 } });
  }
}
