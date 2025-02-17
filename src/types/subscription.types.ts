import { Date, Document, ObjectId } from 'mongoose';

export interface ISubscription extends Document {
  userId: ObjectId;
  startDate: Date;
  nextBillingDate: Date;
  lastPaymentDate: Date | null;
  planId: ObjectId;
  status: 'active' | 'cancelled' | 'expired';
  paymentMethod: 'Stripe';
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

type PlanName = 'mobile' | 'basic' | 'standard' | 'premium';
type VideoQuality = 'Fair' | 'Good' | 'Great' | 'Best';
type Resolution = '480p' | '720p (HD)' | '1080p (Full HD)' | '4K (Ultra HD) + HDR';
type DeviceType = 'Mobile phone' | 'Tablet' | 'TV' | 'Computer';

export interface IPlan extends Document {
  name: PlanName;
  videoQuality: VideoQuality;
  resolution: Resolution;
  spatialAudio: boolean;
  supportedDevices: ReadonlyArray<DeviceType>;
  maxScreens: number;
  downloadDevices: number;
  price: number;
  stripePriceId: string;
}

export interface IPayment extends Document {
  userId: ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'paypal' | 'bank_transfer' | 'stripe';
  transactionStatus: string;
  transactionId: string;
  paymentTimestamp: Date;
  subscription: ObjectId;
}
