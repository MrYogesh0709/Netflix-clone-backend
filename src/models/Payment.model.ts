import { model, Schema } from 'mongoose';
import { IPayment } from '../types/subscription.types';

const paymentSchema = new Schema<IPayment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentMethod: { type: String, enum: ['card', 'paypal', 'bank_transfer'], required: true },
  transactionStatus: { type: String, required: true },
  transactionId: { type: String, required: true },
  paymentTimestamp: { type: Date, default: Date.now },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
});

export const Payment = model<IPayment>('Payment', paymentSchema);
