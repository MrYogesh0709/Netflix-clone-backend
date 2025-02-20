import { Request, Response } from 'express';
import StripeService from '../../services/StripeService';
import { asyncHandler } from '../../utils/asyncHandler';
import User from '../../models/User.model';
import { ApiError } from '../../errors/ApiErrors';

export default class StipeController {
  static createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const { planId, customerEmail } = req.body;
    // TODO: use auth middleware req.user
    const userId = '67b7844f379473c4baaecdba';
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.subscriptionId) throw new ApiError(400, 'User already has an active subscription');

    const sessionUrl = await StripeService.createCheckoutSession(customerEmail, planId, userId);
    res.redirect(303, sessionUrl);
  });

  static createPortalSession = asyncHandler(async (req: Request, res: Response) => {
    const { session_id } = req.body;
    const portalUrl = await StripeService.createPortalSession(session_id);
    res.redirect(303, portalUrl);
  });

  static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    await StripeService.handleWebhook(req);
    res.sendStatus(200);
  });
}
