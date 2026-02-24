import { z } from 'zod';
import { validate } from './authValidator.js';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50).optional(),
  businessName: z.string().trim().max(100).optional(),
  businessEmail: z.string().email('Invalid business email').optional().or(z.literal('')),
  businessPhone: z.string().trim().max(20).optional(),
  businessAddress: z.string().trim().max(200).optional(),
  businessLogo: z.string().optional(),
  taxId: z.string().trim().max(30).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'New password must be at least 6 characters'),
});

export const validateUpdateProfile = validate(updateProfileSchema);
export const validateChangePassword = validate(changePasswordSchema);
