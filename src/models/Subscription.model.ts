import { model, Schema } from 'mongoose';
import { ISubscription } from '../types/subscription.types';

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: { type: String, enum: ['active', 'canceled', 'trialing', 'past_due'], required: true },
    startDate: { type: Date, required: true },
    lastPaymentDate: { type: Date },
    nextBillingDate: { type: Date, required: true },
    paymentMethod: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
  },
  { timestamps: true }
);

const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;
