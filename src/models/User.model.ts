import { Schema, model } from 'mongoose';
import { IUser } from '../types/auth.types';
import { IProfile } from '../types/profile.type';
import { constants } from '../utils/constant';

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    profiles: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Profile' }],
      validate: [
        {
          validator: function (profiles: IProfile[]) {
            return profiles.length <= constants.MAX_PROFILES;
          },
          message: `User cannot have more than ${constants.MAX_PROFILES} profiles`,
        },
      ],
    },
  },
  { timestamps: true }
);

const User = model<IUser>('User', UserSchema);

export default User;
