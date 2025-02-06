import jwt from 'jsonwebtoken';
import { comparePassword, hashPassword } from '../utils/password.util';
import { AuthResponse, AuthRequest } from '../types/auth.types';
import { constants } from '../utils/constant';
import User, { UserType } from '../models/User.model';
import { ApiError } from '../errors/ApiErrors';

export class AuthService {
  private generateTokens(user: UserType): { accessToken: string; refreshToken: string } {
    const payload = { id: user._id, email: user.email };
    const secret = constants.jwt.secret;

    const accessTokenOptions = { expiresIn: constants.jwt.expiresIn };
    const refreshTokenOptions = { expiresIn: constants.jwt.refreshExpiresIn };

    const accessToken = jwt.sign(payload, secret, accessTokenOptions);
    const refreshToken = jwt.sign({ id: user._id }, secret, refreshTokenOptions);

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
    newUser.save();

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
    const decoded = jwt.verify(token, constants.jwt.secret) as { id: string };
    const user = await User.findOne({ _id: decoded.id, refreshToken: token });

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
