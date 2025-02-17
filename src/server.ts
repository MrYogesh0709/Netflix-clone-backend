import express from 'express';
import { env } from './utils/env';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorLogger, expressLogger } from './utils/logger';
import { errorHandler } from './errors/ErrorHandler';
import { notFound } from './errors/notFound';
import { constants } from './utils/constant';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import Stripe from 'stripe';
const stripe = new Stripe(env.STRIPE_SECRET_KEY as string);
//middleware
import { generalLimiterMiddleware } from './api/middleware/rateLimiterMiddleware';

//routes
import userRouter from './api/routes/user.routes';
import profileRouter from './api/routes/profile.routes';
import MovieModel from './models/Movie.model';
import Plan from './models/Plan.model';
import { Payment } from './models/Payment.model';
import Subscription from './models/Subscription.model';

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json({ limit: constants.JSON_LIMIT }));
server.use(cookieParser(env.COOKIE_SECRET));
server.use(expressLogger);
server.use(generalLimiterMiddleware);

server.use('/api/v1/auth', userRouter);
server.use('/api/v1/profile', profileRouter);

server.get('/movies/:id', async (req, res) => {
  try {
    const movie = await MovieModel.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json({
      ...movie.toObject(),
      videoUrl: `${env.VIDEO_BASE_URL}/${movie.videoFolder}/master.m3u8`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.get('/movies/:id/thumbnails', async (req, res) => {
  const { id } = req.params;
  const movie = await MovieModel.findById(id);
  if (!movie) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }
  const { second } = req.query;
  if (!second) {
    res.status(400).json({ error: 'Second parameter is required' });
    return;
  }

  const folderPath = path.join(__dirname, `../videos/${movie.videoFolder}/thumbnails`);

  const thumbnailFile = `thumbnail_${String(second).padStart(3, '0')}.png`;

  const filePath = path.join(folderPath, thumbnailFile);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Thumbnail not found' });
    return;
  }
  const thumbnailUrl = `${env.VIDEO_BASE_URL}/${movie.videoFolder}/thumbnails/${thumbnailFile}`;
  res.json({ thumbnailUrl });
});

server.post('/create-checkout-session', async (req, res) => {
  // const { planId, customerEmail } = req.body;
  const planId = '67b3473095dc70c7c1bf76a2';
  const userId = '67b3494550775796d047c392';
  const customerEmail = 'yogeshvanzara98@gmail.com';

  try {
    const plan = await Plan.findById(planId);
    if (!plan) {
      res.status(404).send('Plan not found');
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: customerEmail,
      line_items: [
        {
          price: plan.stripePriceId, // stored in your Plan model
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
      billing_address_collection: 'required',
      success_url: `${process.env.CLIENT_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription-cancel`,
    });
    console.log('session');
    console.log(session);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

server.get('/retrieve-subscription', async (req, res) => {
  const { sessionId } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const newSubscription = new Subscription({
      userId: session.metadata.user_id,
      planId: session.metadata.plan_id,
      status: subscription.status,
      startDate: new Date(subscription.current_period_start * 1000),
      nextBillingDate: new Date(subscription.current_period_end * 1000),
      paymentMethod: session.payment_method_types[0],
      stripeSubscriptionId: subscription.id,
    });
    await newSubscription.save();

    const payment = new Payment({
      userId: session.metadata.user_id,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentMethod: session.payment_method_types[0],
      transactionStatus: session.payment_status,
      transactionId: session.id,
      subscription: newSubscription._id,
    });
    await payment.save();

    res.json({ subscription: newSubscription, payment });
  } catch (error) {
    res.status(500).send('Failed to retrieve subscription');
  }
});

server.use(notFound);
server.use(errorLogger);
server.use(errorHandler);

export default server;
