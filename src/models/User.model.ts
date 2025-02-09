import { Schema, model } from 'mongoose';
import { IUser } from '../types/auth.types';

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    profiles: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
  },
  { timestamps: true }
);

const User = model<IUser>('User', UserSchema);

export default User;
