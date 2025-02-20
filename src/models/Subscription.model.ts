import mongoose, { Schema } from 'mongoose';
import { ISubscription } from '../types/subscription.types';

// Subscription Schema
const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    status: {
      type: String,
      enum: ['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
      required: true,
      index: true,
    },
    lastPaymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet', 'unknown'],
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    pausedAt: {
      type: Date,
    },
    resumesAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ nextBillingDate: 1, status: 1 });

// Methods for Subscription Schema
SubscriptionSchema.methods.isActive = function (): boolean {
  return this.status === 'active' || this.status === 'trialing';
};

SubscriptionSchema.methods.isCanceled = function (): boolean {
  return this.status === 'canceled';
};

SubscriptionSchema.methods.isTrialing = function (): boolean {
  return this.status === 'trialing';
};

SubscriptionSchema.methods.isPastDue = function (): boolean {
  return this.status === 'past_due';
};

// Pre-save middleware for Subscription
SubscriptionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'canceled') {
    this.canceledAt = new Date();
  }
  next();
});

// Create models
export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

// Export types
export type SubscriptionDocument = mongoose.Document & ISubscription;
