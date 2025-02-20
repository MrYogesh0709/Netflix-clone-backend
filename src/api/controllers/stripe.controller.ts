import { Request, Response } from 'express';
import StripeService from '../../services/StripeService';
import { asyncHandler } from '../../utils/asyncHandler';

export default class StipeController {
  static createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const { planId, customerEmail } = req.body;
    const userId = '67b77e9846cac0a9968fe8e9';
    // TODO: use auth middleware req.user
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
