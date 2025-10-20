import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export const verifyCodeRoute = publicProcedure
  .input(
    z.object({
      emailOrPhone: z.string(),
      code: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { emailOrPhone, code } = input;

    const stored = verificationCodes.get(emailOrPhone);

    if (!stored) {
      throw new Error('No verification code found. Please request a new code.');
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(emailOrPhone);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (stored.code !== code) {
      throw new Error('Invalid verification code. Please try again.');
    }

    verificationCodes.delete(emailOrPhone);

    console.log(`✅ Verification successful for ${emailOrPhone}`);

    return {
      success: true,
      message: 'Account verified successfully',
    };
  });
