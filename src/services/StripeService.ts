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
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        console.log('📌 Subscription Created:', subscription);
        // Handle new subscription logic here
        break;
      }
      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object;
        logger.info('📌 Subscription Updated:', stripeSubscription);
        const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
        if (!subscription) {
          console.error('❌ Subscription not found for update.');
          return;
        }
        const newPriceId = stripeSubscription.items.data[0].price.id;

        const plan = await Plan.findOne({ stripePriceId: newPriceId });
        if (!plan) {
          console.error('❌ No matching Plan found for Stripe Price ID:', newPriceId);
          return;
        }
        subscription.status = stripeSubscription.status;
        subscription.planId = plan._id as Types.ObjectId;
        subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
        await subscription.save();

        logger.info('✅ Subscription updated in database.');
        break;
      }
      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object;
        console.log('📌 Subscription Deleted:', stripeSubscription);

        const subscription = await Subscription.findOne({ stripeSubscriptionId: stripeSubscription.id });
        if (!subscription) {
          console.error('❌ Subscription not found for deletion.');
          return;
        }

        subscription.status = stripeSubscription.status;
        await subscription.save();

        console.log('✅ Subscription marked as canceled in database.');
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
        logger.info('✅ Invoice Paid:', invoice);

        const subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
        if (!subscription) {
          console.error('❌ Subscription not found for invoice.');
          return;
        }

        await Payment.create({
          userId: subscription.userId,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: invoice.payment_intent ? 'card' : 'stripe',
          transactionStatus: 'success',
          transactionId: invoice.payment_intent || invoice.id,
          paymentTimestamp: new Date(invoice.created * 1000),
          subscription: subscription._id,
        });

        // Update Subscription Details
        subscription.lastPaymentDate = new Date();
        subscription.nextBillingDate = new Date(invoice.period_end * 1000);
        await subscription.save();

        logger.info('✅ Payment recorded and subscription updated.');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.error('❌ Invoice Payment Failed:', invoice);
        // Notify user about failed payment & retry
        break;
      }
      case 'invoice.upcoming': {
        const invoice = event.data.object;
        console.log('🔔 Upcoming Invoice:', invoice);
        // Notify user about upcoming charge
        break;
      }
      case 'invoice.voided': {
        const invoice = event.data.object;
        console.log('❌ Invoice Voided:', invoice);
        // Handle voided invoices
        break;
      }
      case 'invoice.marked_uncollectible': {
        const invoice = event.data.object;
        console.log('⚠️ Invoice Marked Uncollectible:', invoice);
        // Handle failed collection
        break;
      }
      /**
       * ✅ Checkout Events
       */
      case 'checkout.session.completed': {
        const session = event.data.object;
        logger.info('✅ Checkout Session Completed:', session);
        const { user_id, plan_id } = session.metadata;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!user_id || !plan_id || !subscriptionId) {
          console.error('❌ Missing required metadata for subscription.');
          return;
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (!stripeSubscription) {
          console.error('❌ Stripe subscription not found.');
          return;
        }

        await Subscription.create({
          userId: user_id,
          planId: plan_id,
          status: stripeSubscription.status,
          startDate: new Date(stripeSubscription.start_date * 1000),
          lastPaymentDate: new Date(),
          nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
          paymentMethod: session.payment_method_types[0],
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });

        logger.info('✅ Subscription saved to database.');
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log('⏳ Checkout Session Expired:', session);
        // Handle expired sessions (maybe notify user)
        break;
      }

      /**
       * ✅ Payment Intent Events (For Custom Payment Handling)
       */
      case 'payment_intent.succeeded': {
        const invoice = event.data.object;
        logger.info('✅ Payment Intent Succeeded:', invoice);
        const subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
        if (!subscription) {
          console.error('❌ Subscription not found for invoice.');
          return;
        }

        await Payment.create({
          userId: subscription.userId,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: invoice.payment_method_types[0] || 'stripe',
          transactionStatus: 'success',
          transactionId: invoice.id,
          paymentTimestamp: new Date(invoice.created * 1000),
          subscription: subscription._id,
        });

        // Update last payment date & next billing date
        subscription.lastPaymentDate = new Date();
        subscription.nextBillingDate = new Date(invoice.period_end * 1000);
        await subscription.save();
        logger.info('✅ Payment recorded and subscription updated.');
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn('❌ Payment Intent Failed:', paymentIntent);
        // Notify user about payment failure
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }
}

export default StripeService;
