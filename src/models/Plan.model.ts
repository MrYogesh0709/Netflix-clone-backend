import { model, Schema } from 'mongoose';
import { IPlan } from '../types/subscription.types';

const PlanSchema = new Schema<IPlan>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['mobile', 'basic', 'standard', 'premium'],
    },
    videoQuality: {
      type: String,
      required: true,
      enum: ['Fair', 'Good', 'Great', 'Best'],
    },
    resolution: {
      type: String,
      required: true,
      enum: ['480p', '720p (HD)', '1080p (Full HD)', '4K (Ultra HD) + HDR'],
    },
    spatialAudio: { type: Boolean, default: false },
    supportedDevices: [
      {
        type: String,
        required: true,
        enum: ['Mobile phone', 'Tablet', 'TV', 'Computer'],
      },
    ],
    maxScreens: { type: Number, required: true },
    downloadDevices: { type: Number, required: true },
    price: { type: Number, required: true },
    stripePriceId: { type: String, required: true },
  },
  { timestamps: true }
);

const Plan = model<IPlan>('Plan', PlanSchema);

export default Plan;
