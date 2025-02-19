import { Request, Response } from 'express';
import StripeService from '../../services/StripeService';

export default class StipeController {
  static async createCheckoutSession(req: Request, res: Response) {
    const { planId, customerEmail } = req.body;
    const userId = '67b3494550775796d047c392';
    // TODO: use auth middleware req.user
    try {
      const sessionUrl = await StripeService.createCheckoutSession(customerEmail, planId, userId);
      res.redirect(303, sessionUrl);
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }

  static async createPortalSession(req: Request, res: Response) {
    const { session_id } = req.body;

    try {
      const portalUrl = await StripeService.createPortalSession(session_id);
      res.redirect(303, portalUrl);
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
  static async handleWebhook(req: Request, res: Response) {
    try {
      await StripeService.handleWebhook(req);
      res.sendStatus(200);
    } catch (error) {
      console.error('Webhook error:', (error as Error).message);
      res.sendStatus(400);
    }
  }
}
