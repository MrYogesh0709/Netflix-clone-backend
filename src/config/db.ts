import mongoose from 'mongoose';
import { env } from './env';

export default async function connectToMongoDB() {
  try {
    await mongoose.connect(env.MONGO_URI!);
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error connecting to MongoDB:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    process.exit(1);
  }
}
