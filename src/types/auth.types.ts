import { Document, Types } from 'mongoose';

export interface UserType extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
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
}
