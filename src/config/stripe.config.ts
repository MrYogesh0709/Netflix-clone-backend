import Stripe from 'stripe';
import { env } from '../utils/env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY as string);

export default stripe;
