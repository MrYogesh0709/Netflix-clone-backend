import { JwtPayload } from 'jsonwebtoken';
import { Document, ObjectId } from 'mongoose';
export interface IUser extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
  profiles: ObjectId[];
  admin: boolean;
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
  user: { id: ObjectId; email: string };
  profiles?: ObjectId[];
}
