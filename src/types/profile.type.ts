import { Document, ObjectId } from 'mongoose';

export interface IProfile extends Document {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  language: string;
  isKids: boolean;
  preferences: {
    autoplayNext: boolean;
    autoplayPreviews: boolean;
  };
}
