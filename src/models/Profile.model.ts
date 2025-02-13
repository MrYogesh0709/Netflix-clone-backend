import { model, Schema } from 'mongoose';
import { IProfile } from '../types/profile.type';

const ProfileSchema = new Schema<IProfile>({
  name: { type: String, required: true },
  language: { type: String, default: 'en' },
  preferences: {
    autoplayNext: { type: Boolean, default: true },
    autoplayPreviews: { type: Boolean, default: true },
  },
  isKids: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

ProfileSchema.index({ userId: 1, name: 1 }, { unique: true });

const Profile = model<IProfile>('Profile', ProfileSchema);

export default Profile;
