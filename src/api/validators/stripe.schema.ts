import { z } from 'zod';

export const checkoutValidator = z.object({
  customerEmail: z.string().email({ message: 'Invalid email format' }).trim(),
  planId: z.string().min(1, { message: 'Plan ID is required' }).trim(),
  //todo: remove comment add middleware
  // userId: z.string().min(1, { message: 'User ID is required' }).trim(),
});

export const portalSessionValidator = z.object({
  session_id: z.string().min(1, { message: 'Session Id is required' }).trim(),
});

export type ICreateCheckoutValidator = z.infer<typeof checkoutValidator>;
export type IPortalSessionValidator = z.infer<typeof portalSessionValidator>;
