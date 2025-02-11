import { z } from 'zod';

export const profileValidator = z
  .object({
    name: z.string().trim().min(1, 'name must be at least one character').max(50, 'name can not exceed 50 character'),
    language: z
      .string()
      .trim()
      .min(1, 'language must be at least one character')
      .max(5, 'Language should be a 2-5 character code')
      .optional()
      .default('en'),
    isKids: z.boolean().default(false),
    preferences: z
      .object({
        autoplayNext: z.boolean().default(true),
        autoplayPreviews: z.boolean().default(true),
      })
      .optional(),
  })
  .strict();
export const updateProfileValidator = profileValidator.partial().strict();

export type IProfileValidator = z.infer<typeof profileValidator>;
export type IUpdateProfileValidator = z.infer<typeof updateProfileValidator>;
