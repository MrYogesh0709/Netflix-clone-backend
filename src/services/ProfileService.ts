import { ApiError } from '../errors/ApiErrors';
import Profile from '../models/Profile.model';
import User from '../models/User.model';
import { IProfile } from '../types/profile.type';

export class ProfileService {
  static async createProfile(data: IProfile) {
    const existingProfile = await Profile.findOne({
      name: data.name,
      userId: data.userId,
    });

    if (existingProfile) {
      throw new ApiError(400, 'Profile with this name already exists');
    }
    const result = await Profile.create(data);

    await User.findByIdAndUpdate(data.userId, { $push: { profiles: result._id } });
    return result;
  }
  static async getProfile(profileId: string, userId: string) {
    const result = await Profile.findOne({ _id: profileId });
    if (!result) {
      throw new ApiError(404, 'Profile not Found');
    }
    if (result.userId.toString() !== userId) {
      throw new ApiError(403, 'You are not allowed to update this profile');
    }
    return result;
  }
  static async updateProfile(profileId: string, data: Partial<IProfile>, userId: string) {
    const profile = await Profile.findById(profileId);
    if (!profile) throw new ApiError(404, 'Profile not Found');

    if (profile.userId.toString() !== userId) {
      throw new ApiError(403, 'You are not allowed to update this profile');
    }
    const result = await Profile.findByIdAndUpdate(profileId, data, { new: true, runValidators: true });

    return result;
  }
  static async deleteProfile(profileId: string, userId: string) {
    const profile = await Profile.findById(profileId);
    if (!profile) throw new ApiError(404, 'Profile not Found');

    if (profile.userId.toString() !== userId) {
      throw new ApiError(403, 'You are not allowed to update this profile');
    }
    const result = await Profile.findByIdAndDelete(profileId);

    await User.findByIdAndUpdate(userId, { $pull: { profiles: profileId } });
    if (!result) {
      throw new ApiError(404, 'Profile not Found');
    }
    return result;
  }
}
