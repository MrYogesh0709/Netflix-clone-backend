import Plan from '../models/Plan.model';
import { Request } from 'express';
import { FRONTEND_URL } from '../utils/constant';
import { env } from '../utils/env';
import stripe from '../config/stripe.config';
import { ApiError } from '../errors/ApiErrors';
import { logger } from '../utils/logger';
import { Payment } from '../models/Payment.model';
import mongoose, { Types } from 'mongoose';
import User from '../models/User.model';
import Stripe from 'stripe';
import { Subscription } from '../models/Subscription.model';
import { log } from 'winston';
import { IPayment } from '../types/subscription.types';

const endpointSecret = env.STRIPE_WEBHOOK_ENDPOINT;

type SupportedWebhookEvents =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'invoice.upcoming'
  | 'checkout.session.expired';

class StripeService {
  private static readonly SUPPORTED_EVENTS: Set<string> = new Set([
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'invoice.upcoming',
    'checkout.session.expired',
  ]);
  static async createCheckoutSession(customerEmail: string, planId: string, userId: string) {
    const plan = await Plan.findById(planId);
    if (!plan) throw new ApiError(400, 'Plan not found');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: customerEmail,
      mode: 'subscription',
      subscription_data: {
        metadata: { user_id: userId, plan_id: planId },
      },
      billing_address_collection: 'required',
      success_url: `${FRONTEND_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}?canceled=true`,
    });

    return session.url as string;
  }

  static async createPortalSession(sessionId: string) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (typeof checkoutSession.customer !== 'string') throw new ApiError(400, 'Invalid customer ID');

    const customer = await stripe.customers.retrieve(checkoutSession.customer);
    if (!customer) throw new ApiError(400, 'Customer not found in Stripe');

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: checkoutSession.customer,
      return_url: FRONTEND_URL,
    });

    return portalSession.url;
  }

  static async handleWebhook(req: Request) {
    if (!req.body || !Buffer.isBuffer(req.body)) {
      throw new ApiError(400, 'Invalid webhook payload');
    }
    // 1. Verify and construct the event
    const event = await StripeService.verifyWebhook(req);

    // 2. Validate event type
    if (!StripeService.SUPPORTED_EVENTS.has(event.type)) {
      logger.warn(`Unhandled event type ${event.type}`, { eventId: event.id });
      return;
    }

    // 3. Process event with error handling
    try {
      await StripeService.processEvent(event as Stripe.Event & { type: SupportedWebhookEvents });
    } catch (error) {
      logger.error('Error processing webhook event', {
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error; // Re-throw to trigger 500 response to Stripe
    }
  }
  private static async verifyWebhook(req: Request): Promise<Stripe.Event> {
    const signature = req.headers['stripe-signature'];

    if (!signature || typeof signature !== 'string') {
      throw new ApiError(400, 'Missing stripe-signature header');
    }

    if (!endpointSecret) {
      throw new ApiError(500, 'Missing Stripe webhook secret');
    }

    try {
      return stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err });
      throw new ApiError(400, 'Invalid webhook signature');
    }
  }
  private static async processEvent(event: Stripe.Event & { type: SupportedWebhookEvents }) {
    switch (event.type) {
      case 'customer.subscription.created':
        await StripeService.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await StripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await StripeService.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await StripeService.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await StripeService.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.upcoming':
        await StripeService.handleUpcomingInvoice(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.expired':
        await StripeService.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
    }
  }
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    if (!subscription.metadata || !subscription.metadata.user_id || !subscription.metadata.plan_id) {
      throw new ApiError(400, 'Missing required metadata: user_id or plan_id');
    }
    const { user_id, plan_id } = subscription.metadata || {};

    // Validate user exists
    const user = await User.findById(user_id);
    if (!user) {
      throw new ApiError(404, `User not found: ${user_id}`);
    }

    // Create subscription with idempotency check
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (existingSubscription) {
      logger.info('Subscription already exists', { subscriptionId: existingSubscription._id });
      return;
    }

    const newSubscription = await Subscription.create({
      userId: user_id,
      planId: plan_id,
      status: subscription.status,
      startDate: new Date(subscription.start_date * 1000),
      nextBillingDate: new Date(subscription.current_period_end * 1000),
      paymentMethod: subscription.default_payment_method ? 'card' : 'unknown',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    logger.info('Subscription created', {
      subscriptionId: newSubscription._id,
      stripeSubscriptionId: subscription.id,
    });
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      throw new ApiError(404, `Subscription not found: ${subscription.id}`);
    }
    const newPriceId = subscription.items.data[0]?.price?.id;
    if (!newPriceId) {
      throw new ApiError(400, 'Invalid subscription data: missing price ID');
    }

    const plan = await Plan.findOne({ stripePriceId: newPriceId });
    if (!plan) {
      throw new ApiError(404, `Plan not found for price: ${newPriceId}`);
    }

    // Update subscription with change tracking
    const changes: Record<string, any> = {};

    if (existingSubscription.status !== subscription.status) {
      changes.status = subscription.status;
    }

    if (!existingSubscription.planId.equals(plan._id)) {
      changes.planId = plan._id;
    }

    const newBillingDate = new Date(subscription.current_period_end * 1000);
    if (existingSubscription.nextBillingDate.getTime() !== newBillingDate.getTime()) {
      changes.nextBillingDate = newBillingDate;
    }

    if (existingSubscription.cancelAtPeriodEnd !== subscription.cancel_at_period_end) {
      changes.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      if (subscription.cancel_at_period_end) {
        changes.status = 'canceled';
      }
    }

    if (Object.keys(changes).length > 0) {
      Object.assign(existingSubscription, changes);
      await existingSubscription.save();
      logger.info('Subscription updated', {
        subscriptionId: existingSubscription._id,
        changes,
      });
    }
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const existingSubscription = await Subscription.findOne({
      stripeSubscriptionId: subscription.id,
    });

    if (!existingSubscription) {
      throw new ApiError(404, `Subscription not found: ${subscription.id}`);
    }

    // Handle subscription deletion with cascading updates
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      existingSubscription.status = 'canceled';
      existingSubscription.canceledAt = new Date();
      await existingSubscription.save({ session });

      const user = await User.findById(existingSubscription.userId).session(session);
      if (user?.subscriptionId?.equals(existingSubscription._id)) {
        user.subscriptionId = null;
        await user.save({ session });
      }

      await session.commitTransaction();
      logger.info('Subscription canceled', {
        subscriptionId: existingSubscription._id,
        userId: existingSubscription.userId,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if (!invoice.subscription || !invoice.payment_intent) {
      logger.warn('Invoice missing required fields', { invoiceId: invoice.id });
      return;
    }
    const paymentIntentId =
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;

    if (invoice.amount_paid == null) {
      logger.warn('Amount paid missing in invoice', { invoiceId: invoice.id });
      throw new ApiError(400, 'Invalid invoice data');
    }

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    });
    if (!subscription) {
      throw new ApiError(404, 'Subscription not found for successful payment');
    }

    const existingPayment = await Payment.findOne({
      transactionId: paymentIntentId,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let payment: mongoose.Document<unknown, {}, IPayment> &
        IPayment &
        Required<{
          _id: Types.ObjectId;
        }> & { __v: number };
      if (existingPayment) {
        if (existingPayment.transactionStatus !== 'success') {
          existingPayment.transactionStatus = 'success';
          existingPayment.amount = invoice.amount_paid / 100;
          existingPayment.paymentTimestamp = new Date();
          await existingPayment.save({ session });
          logger.info('Updated existing payment to success', {
            paymentId: existingPayment._id,
            invoiceId: invoice.id,
          });
        }
        payment = existingPayment;
      } else {
        const paymentDoc = {
          userId: subscription.userId,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: 'card',
          transactionStatus: 'success',
          transactionId: paymentIntentId,
          paymentTimestamp: new Date(),
          subscriptionId: subscription._id,
        };
        const [newPayment] = await Payment.create([paymentDoc], { session });
        if (!newPayment) {
          throw new Error('Failed to create payment');
        }
        payment = newPayment;
      }

      const user = await User.findById(subscription.userId).session(session);
      if (!user) {
        throw new ApiError(404, `User not found for subscription: ${subscription.userId}`);
      }

      user.paymentIds = user.paymentIds || [];
      if (!user.paymentIds.includes(payment._id)) {
        user.paymentIds.push(payment._id);
      }
      if (!user.subscriptionId) {
        user.subscriptionId = subscription._id;
        logger.info('Linking subscription to user', { userId: user._id, subscriptionId: subscription._id });
      }
      await user.save({ session });

      subscription.status = 'active';
      subscription.lastPaymentDate = new Date();
      subscription.nextBillingDate = new Date(invoice.period_end * 1000);
      if (invoice.default_payment_method || payment.paymentMethod) {
        subscription.paymentMethod = payment.paymentMethod;
      }
      await subscription.save({ session });

      await session.commitTransaction();
      logger.info('Payment processed successfully', {
        subscriptionId: subscription._id,
        paymentId: payment._id,
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Failed to process payment succeeded event', {
        invoiceId: invoice.id,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    if (!invoice.subscription || !invoice.payment_intent) {
      logger.warn('Invoice missing required fields', {
        invoiceId: invoice.id,
      });
      return;
    }

    const paymentIntentId =
      typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    });
    if (!subscription) {
      throw new ApiError(404, 'Subscription not found for failed payment');
    }

    subscription.status = 'past_due';
    await subscription.save();
    let failureReason: string | undefined;

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      failureReason = paymentIntent.last_payment_error?.message;
    } catch (error) {
      logger.warn('Could not retrieve payment intent details', {
        paymentIntentId,
        error,
      });
    }

    // Create failed payment record
    await Payment.create({
      userId: subscription.userId,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      paymentMethod: 'card',
      transactionStatus: 'failed',
      transactionId: invoice.payment_intent,
      paymentTimestamp: new Date(),
      subscriptionId: subscription._id,
      failureReason: failureReason,
    });

    logger.error('Payment failed', {
      subscriptionId: subscription._id,
      invoiceId: invoice.id,
      error: failureReason,
    });
  }

  private static async handleUpcomingInvoice(invoice: Stripe.Invoice) {
    if (!invoice.subscription) {
      logger.warn('Upcoming invoice without subscription', { invoiceId: invoice.id });
      return;
    }

    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    });

    if (!subscription) {
      throw new ApiError(404, 'Subscription not found for upcoming invoice');
    }

    if (invoice.next_payment_attempt) {
      subscription.nextBillingDate = new Date(invoice.next_payment_attempt * 1000);
      await subscription.save();

      logger.info('Updated next billing date', {
        subscriptionId: subscription._id,
        nextBillingDate: subscription.nextBillingDate,
      });
    }
  }

  private static async handleCheckoutExpired(session: Stripe.Checkout.Session) {
    logger.info('Checkout session expired', {
      sessionId: session.id,
      customerId: session.customer,
      metadata: session.metadata,
    });
  }
}

export default StripeService;
