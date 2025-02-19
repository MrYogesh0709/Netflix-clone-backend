import Plan from '../models/Plan.model';
import { Request } from 'express';
import { FRONTEND_URL } from '../utils/constant';
import { env } from '../utils/env';
import stripe from '../config/stripe.config';
import { ApiError } from '../errors/ApiErrors';
import Subscription from '../models/Subscription.model';
import { logger } from '../utils/logger';
import { Payment } from '../models/Payment.model';
import { Types } from 'mongoose';
import User from '../models/User.model';

const endpointSecret = env.STRIPE_WEBHOOK_ENDPOINT;

class StripeService {
  static async createCheckoutSession(customerEmail: string, planId: string, userId: string) {
    const plan = await Plan.findById(planId);
    if (!plan) throw new ApiError(400, 'Plan not found');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: customerEmail,
      mode: 'subscription',
      metadata: { user_id: userId, plan_id: planId },
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
    let event = req.body;
    const signature = req.headers['stripe-signature'] as string;

    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      } catch (err) {
        throw new ApiError(400, 'Webhook signature verification failed');
      }
    }

    switch (event.type) {
      /**
       * ✅ Subscription Events
       */
      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object;
        logger.info('Subscription Update Event:', stripeSubscription);

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscription.id,
        });

        if (!subscription) {
          throw new Error(`Subscription not found: ${stripeSubscription.id}`);
        }

        // Get the new plan from the updated subscription
        const newPriceId = stripeSubscription.items.data[0].price.id;
        const plan = await Plan.findOne({ stripePriceId: newPriceId });

        if (!plan) {
          throw new Error(`Plan not found for price: ${newPriceId}`);
        }

        // Update subscription details
        subscription.status = stripeSubscription.status;
        subscription.planId = plan._id as Types.ObjectId;
        subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);

        if (stripeSubscription.cancel_at_period_end) {
          subscription.status = 'canceled';
        }

        await subscription.save();
        logger.info('Subscription updated successfully', { subscriptionId: subscription._id });
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object;
        logger.info('Subscription Deletion Event:', stripeSubscription);

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscription.id,
        });

        if (!subscription) {
          throw new Error(`Subscription not found: ${stripeSubscription.id}`);
        }

        // Update subscription status
        subscription.status = 'canceled';
        await subscription.save();

        // Find and update user
        const user = await User.findById(subscription.userId);
        if (user) {
          user.subscriptionId = null;
          await user.save();
        }

        logger.info('Subscription canceled successfully', {
          subscriptionId: subscription._id,
          userId: subscription.userId,
        });
        break;
      }
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        console.log('📌 Subscription Trial Ending Soon:', subscription);
        // Notify user their trial is about to expire
        break;
      }
      /**
       * ✅ Invoice Events
       */
      case 'invoice.paid': {
        const invoice = event.data.object;
        logger.info('Processing invoice paid event', { invoiceId: invoice.id });

        if (!invoice.subscription) {
          throw new Error('No subscription found on invoice');
        }

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription,
        });

        if (!subscription) {
          throw new Error(`Subscription not found for invoice: ${invoice.id}`);
        }

        // Create payment record
        const payment = await Payment.create({
          userId: subscription.userId,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: invoice.payment_intent ? 'card' : 'stripe',
          transactionStatus: 'success',
          transactionId: invoice.payment_intent || invoice.id,
          paymentTimestamp: new Date(invoice.created * 1000),
          subscriptionId: subscription._id,
        });

        // Update user's payment records
        const user = await User.findById(subscription.userId);
        if (!user) {
          throw new Error(`User not found: ${subscription.userId}`);
        }

        user.paymentIds = user.paymentIds || [];
        user.paymentIds.push(payment._id as Types.ObjectId);
        await user.save();

        // Update subscription
        subscription.lastPaymentDate = new Date();
        subscription.nextBillingDate = new Date(invoice.period_end * 1000);
        await subscription.save();

        logger.info('Successfully processed invoice payment', {
          userId: user._id,
          paymentId: payment._id,
          subscriptionId: subscription._id,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        logger.info('Payment succeeded for renewal:', invoice);

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription,
        });

        if (!subscription) {
          throw new ApiError(404, 'Subscription not found for successful payment');
        }

        // Update subscription status and dates
        subscription.status = 'active';
        subscription.lastPaymentDate = new Date();
        subscription.nextBillingDate = new Date(invoice.period_end * 1000);
        await subscription.save();

        // Create payment record
        const payment = await Payment.create({
          userId: subscription.userId,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: 'card',
          transactionStatus: 'success',
          transactionId: invoice.payment_intent,
          paymentTimestamp: new Date(),
          subscriptionId: subscription._id,
        });

        // Update user's payment records
        const user = await User.findById(subscription.userId);
        if (user) {
          user.paymentIds.push(payment._id as Types.ObjectId);
          await user.save();
        }

        // return res.json({
        //     success: true,
        //     message: 'Renewal payment processed successfully'
        // });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.error('Payment failed for invoice:', invoice);

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription,
        });

        if (!subscription) throw new ApiError(400, 'Subscription not found for failed payment');

        // Update subscription status
        subscription.status = 'past_due';
        await subscription.save();

        // Update user about payment failure
        const user = await User.findById(subscription.userId);
        if (user) {
          // Here you could trigger email notification to user
          logger.info('Payment failed for user:', user._id);
        }

        // return res.json({
        //   success: false,
        //   message: 'Payment failed',
        //   details: {
        //     attemptCount: invoice.attempt_count,
        //     nextAttempt: invoice.next_payment_attempt,
        //   },
        // });

        break;
      }
      case 'invoice.upcoming': {
        const invoice = event.data.object;
        logger.info('Upcoming invoice for renewal:', invoice);

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription,
        });

        if (!subscription) throw new ApiError(400, 'Subscription not found for upcoming renewal');

        // Update next billing date
        subscription.nextBillingDate = new Date(invoice.next_payment_attempt * 1000);
        await subscription.save();

        // return res.json({
        //     success: true,
        //     message: 'Renewal notification processed'
        // });
        break;
      }

      /**
       * ✅ Checkout Events
       */
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info('Checkout Session Data:', {
          metadata: session.metadata,
          customer: session.customer,
          subscription: session.subscription,
        });

        const { user_id, plan_id } = session.metadata || {};
        if (!user_id || !plan_id) {
          throw new Error(`Missing metadata. user_id: ${user_id}, plan_id: ${plan_id}`);
        }

        // Fetch user first to ensure they exist
        const user = await User.findById(user_id);
        if (!user) {
          throw new Error(`User not found: ${user_id}`);
        }

        // Retrieve subscription details
        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);

        // Create subscription document
        const subscription = await Subscription.create({
          userId: user_id,
          planId: plan_id,
          status: stripeSubscription.status,
          startDate: new Date(stripeSubscription.start_date * 1000),
          lastPaymentDate: new Date(),
          nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
          paymentMethod: session.payment_method_types[0],
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        });

        // Update user with new subscription
        user.subscriptionId = subscription._id as Types.ObjectId;
        await user.save();

        logger.info('Successfully processed checkout session', {
          userId: user_id,
          subscriptionId: subscription._id,
        });

        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('⏳ Checkout Session Expired:', session);
        // Handle expired sessions (maybe notify user)
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}

export default StripeService;
