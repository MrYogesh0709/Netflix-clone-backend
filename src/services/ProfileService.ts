import { redis } from '../config/redis.config';
import { ApiError } from '../errors/ApiErrors';
import Profile from '../models/Profile.model';
import User from '../models/User.model';
import { IProfile } from '../types/profile.type';
import { constants } from '../utils/constant';

export class ProfileService {
  private static readonly CACHE_TTL = 600; // 10 minutes in seconds
  private static readonly CACHE_PREFIX = 'profile:';
  private static readonly USER_PROFILES_PREFIX = 'user_profiles:';

  private static generateProfileKey(profileId: string): string {
    return `${this.CACHE_PREFIX}${profileId}`;
  }

  private static generateUserProfilesKey(userId: string): string {
    return `${this.USER_PROFILES_PREFIX}${userId}`;
  }

  private static async clearUserProfilesCache(userId: string): Promise<void> {
    await redis.del(this.generateUserProfilesKey(userId));
  }

  private static async clearProfileCache(profileId: string): Promise<void> {
    await redis.del(this.generateProfileKey(profileId));
  }
  static async createProfile(data: IProfile) {
    const userId = data.userId.toString();

    // Combine user existence check and profile count in one query
    const [userExists, profileCount] = await Promise.all([
      User.exists({ _id: userId }),
      Profile.countDocuments({ userId }),
    ]);

    if (!userExists) throw new ApiError(404, 'User not found');

    if (profileCount >= constants.MAX_PROFILES) {
      throw new ApiError(400, `Cannot create more than ${constants.MAX_PROFILES} profiles per user`);
    }

    const existingProfile = await Profile.findOne({ userId, name: data.name });
    if (existingProfile) throw new ApiError(400, 'Profile with this name already exists');

    const result = await Profile.create(data);
    await Promise.all([
      User.findByIdAndUpdate(userId, { $push: { profiles: result._id } }),
      redis.setex(this.generateProfileKey(result._id.toString()), this.CACHE_TTL, JSON.stringify(result)),
      this.clearUserProfilesCache(userId),
    ]);

    return result;
  }

  static async getProfile(profileId: string, userId: string) {
    const cacheKey = this.generateProfileKey(profileId);
    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      const profile = JSON.parse(cachedProfile);
      if (profile.userId.toString() !== userId) throw new ApiError(403, 'You are not allowed to see this profile');
      return profile;
    }
    const result = await Profile.findOne({ _id: profileId, userId });
    if (!result) throw new ApiError(404, 'Profile not Found');

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    return result;
  }

  static async getUserProfiles(userId: string) {
    const cacheKey = this.generateUserProfilesKey(userId);
    const cachedProfiles = await redis.get(cacheKey);

    if (cachedProfiles) return JSON.parse(cachedProfiles);

    const profiles = await Profile.find({ userId }).lean();
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(profiles));

    return profiles;
  }

  static async updateProfile(profileId: string, data: Partial<IProfile>, userId: string) {
    const result = await Profile.findOneAndUpdate(
      {
        _id: profileId,
        userId,
        ...(data.name && { name: { $ne: data.name } }),
      },
      data,
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new ApiError(400, 'Profile not found, access denied, or name already exists');
    }

    await Promise.all([
      redis.setex(ProfileService.generateProfileKey(profileId), ProfileService.CACHE_TTL, JSON.stringify(result)),
      ProfileService.clearUserProfilesCache(userId),
    ]);

    return result;
  }

  static async deleteProfile(profileId: string, userId: string) {
    const result = await Profile.findOneAndDelete({
      _id: profileId,
      userId,
    });
    if (!result) {
      throw new ApiError(404, 'Profile not found or access denied');
    }
    await Promise.all([
      this.clearProfileCache(profileId),
      this.clearUserProfilesCache(userId),
      User.findByIdAndUpdate(userId, { $pull: { profiles: profileId } }),
    ]);
    return result;
  }
}
