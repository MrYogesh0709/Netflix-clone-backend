import { JwtPayload } from 'jsonwebtoken';
import { Document, Types } from 'mongoose';
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
  profiles: Types.ObjectId[];
  admin: boolean;
  subscriptionId: Types.ObjectId | null;
  paymentIds: Types.ObjectId[];
}

export interface CustomJwtPayload extends JwtPayload {
  userId: string;
  email?: string;
}
export interface AuthRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: Types.ObjectId; email: string };
  profiles?: Types.ObjectId[];
}
