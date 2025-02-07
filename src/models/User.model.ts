import { Schema, model } from 'mongoose';
import { UserType } from '../types/auth.types';

const UserSchema = new Schema<UserType>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

const User = model<UserType>('User', UserSchema);

export default User;
