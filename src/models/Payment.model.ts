import mongoose, { Schema } from 'mongoose';
import { IPayment } from '../types/subscription.types';

// Payment Schema
const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer', 'wallet', 'unknown'],
      required: true,
    },
    transactionStatus: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);
PaymentSchema.index({ userId: 1, transactionStatus: 1 });
PaymentSchema.index({ subscriptionId: 1, transactionStatus: 1 });

// Methods for Payment Schema
PaymentSchema.methods.isSuccessful = function (): boolean {
  return this.transactionStatus === 'success';
};

PaymentSchema.methods.isRefunded = function (): boolean {
  return this.transactionStatus === 'refunded';
};

PaymentSchema.methods.isPending = function (): boolean {
  return this.transactionStatus === 'pending' || this.transactionStatus === 'processing';
};

// Virtual for formatted amount
PaymentSchema.virtual('formattedAmount').get(function () {
  return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export type PaymentDocument = mongoose.Document & IPayment;
