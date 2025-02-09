import { Document, ObjectId } from 'mongoose';

export interface IProfile extends Document {
  userId: ObjectId;
  name: string;
  language: string;
  isKids: boolean;
  preferences: {
    autoplayNext: boolean;
    autoplayPreviews: boolean;
  };
}
