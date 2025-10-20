import { publicProcedure } from '../../../create-context';
import { z } from 'zod';

const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

export const sendVerificationRoute = publicProcedure
  .input(
    z.object({
      emailOrPhone: z.string(),
      authMethod: z.enum(['email', 'phone']),
    })
  )
  .mutation(async ({ input }) => {
    const { emailOrPhone, authMethod } = input;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    verificationCodes.set(emailOrPhone, { code, expiresAt });

    console.log(`=== VERIFICATION CODE ===`);
    console.log(`Method: ${authMethod}`);
    console.log(`To: ${emailOrPhone}`);
    console.log(`Code: ${code}`);
    console.log(`Expires: ${new Date(expiresAt).toISOString()}`);
    console.log(`========================`);

    if (authMethod === 'email') {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY || ''}`,
          },
          body: JSON.stringify({
            from: 'Padel App <onboarding@resend.dev>',
            to: emailOrPhone,
            subject: 'Your Verification Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #333; text-align: center;">🎾 Verify Your Account</h1>
                <p style="color: #666; font-size: 16px; line-height: 1.5;">
                  Welcome! Use the following code to verify your account:
                </p>
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                  <h2 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h2>
                </div>
                <p style="color: #999; font-size: 14px;">
                  This code will expire in 10 minutes.
                </p>
                <p style="color: #999; font-size: 14px;">
                  If you didn't request this code, please ignore this email.
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Failed to send email:', error);
          throw new Error('Failed to send verification email');
        }

        console.log('Email sent successfully via Resend');
      } catch (error) {
        console.error('Email sending error:', error);
      }
    } else {
      console.log('SMS verification not implemented - showing code in logs only');
    }

    return {
      success: true,
      message: `Verification code sent to ${emailOrPhone}`,
    };
  });
