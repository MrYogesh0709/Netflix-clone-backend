import express from 'express';
const router = express.Router();
import StripeController from '../controllers/stripe.controller';
import StipeController from '../controllers/stripe.controller';
import { checkoutValidator, portalSessionValidator } from '../validators/stripe.schema';
import { validate } from '../middleware/validate';

router.route('/create-checkout-session').post(validate(checkoutValidator), StripeController.createCheckoutSession);
router.route('/create-portal-session').post(validate(portalSessionValidator), StipeController.createPortalSession);

export default router;
