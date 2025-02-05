import { Schema, model, Document } from 'mongoose';

interface User extends Document {
  username: string;
  email: string;
  password: string;
}

const UserSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const User = model<User>('User', UserSchema);

export default User;
