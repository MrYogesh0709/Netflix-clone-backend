import { Document, Types } from 'mongoose';
export type SubscriptionStatus =
  | 'incomplete' // Initial status when created
  | 'incomplete_expired' // Initial payment attempt failed
  | 'active' // Subscription is active
  | 'past_due' // Payment failed but can be recovered
  | 'canceled' // Subscription is canceled
  | 'unpaid' // Final state after failed payments
  | 'paused'; // Subscription is paused

export type PaymentMethod = 'card' | 'bank_transfer' | 'wallet' | 'unknown';

export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId: Types.ObjectId;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  trialEndsAt?: Date;
  canceledAt?: Date;
  nextBillingDate: Date;
  lastPaymentDate?: Date;
  paymentMethod: PaymentMethod;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
  pausedAt?: Date;
  resumesAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type PlanName = 'mobile' | 'basic' | 'standard' | 'premium';
type VideoQuality = 'Fair' | 'Good' | 'Great' | 'Best';
type Resolution = '480p' | '720p (HD)' | '1080p (Full HD)' | '4K (Ultra HD) + HDR';
type DeviceType = 'Mobile phone' | 'Tablet' | 'TV' | 'Computer';

export interface IPlan extends Document {
  _id: Types.ObjectId;
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
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  transactionStatus: PaymentStatus;
  transactionId: string;
  paymentTimestamp: Date;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
