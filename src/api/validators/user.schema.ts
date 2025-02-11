import { z } from 'zod';

export const UserSchemaRegister = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers'),
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    password: z
      .string()
      .trim()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[\W_]/, 'Password must contain at least one special character'),
  })
  .strict();

export const UserSchemaLogin = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email format'),
    password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  })
  .strict();

export type UserInputRegister = z.infer<typeof UserSchemaRegister>;
export type UserInputLogin = z.infer<typeof UserSchemaLogin>;
