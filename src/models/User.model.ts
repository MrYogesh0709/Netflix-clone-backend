import { Schema, model, Document } from 'mongoose';

export interface UserType extends Document {
  username: string;
  email: string;
  password: string;
  refreshToken?: string;
}

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
