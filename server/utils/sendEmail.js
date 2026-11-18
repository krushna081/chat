import axios from 'axios';
import env from '../config/env.js';
import { AppError } from '../middleware/errors.js';

const sendEmail = async ({ to, subject, html }) => {
  if (env.isTest) return { id: 'test-email' };

  if (!env.resendApiKey) {
    if (env.isProduction) {
      throw new AppError(503, 'Email delivery is not configured');
    }
    console.info(
      `[email:dev] ${subject} for ${to}: ${html.match(/>(\d{6})</)?.[1] || 'see template'}`
    );
    return { id: 'dev-email' };
  }

  const recipient =
    !env.isProduction && process.env.RESEND_TEST_EMAIL ? process.env.RESEND_TEST_EMAIL : to;

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: env.emailFrom,
        to: recipient,
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `[email] Resend request failed with status ${error?.response?.status || 'unknown'}`
    );
    throw new AppError(502, 'Could not send email. Please try again.');
  }
};

const template = ({ title, intro, otp, warning, footer }) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        body { margin: 0; background: #f0f2f5; color: #111b21; font-family: Arial, sans-serif; }
        .container { max-width: 560px; margin: 0 auto; padding: 24px; }
        .header { background: #0f766e; color: #ffffff; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; }
        .otp { background: #ccfbf1; color: #0f766e; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 10px; margin: 20px 0; }
        .warning { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; font-size: 14px; }
        .footer { color: #667781; font-size: 12px; text-align: center; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>${title}</h1></div>
        <div class="content">
          <p>${intro}</p>
          <div class="otp">${otp}</div>
          <div class="warning">${warning}</div>
          <p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
        </div>
        <div class="footer">${footer}</div>
      </div>
    </body>
  </html>
`;

export const sendOtpEmail = async (email, otp, purpose = 'verification') => {
  const isReset = purpose === 'password_reset';
  return sendEmail({
    to: email,
    subject: isReset ? 'Reset your RelayChat password' : 'Verify your RelayChat account',
    html: template({
      title: isReset ? 'Reset your password' : 'Verify your email',
      intro: isReset
        ? 'Use this one-time code to choose a new password for your RelayChat account.'
        : 'Welcome to RelayChat. Use this one-time code to verify your email address.',
      otp,
      warning: 'Never share this code. RelayChat support will never ask you for a one-time code.',
      footer: `© ${new Date().getFullYear()} RelayChat. This is an automated message.`,
    }),
  });
};

export const sendPasswordResetEmail = (email, otp) => sendOtpEmail(email, otp, 'password_reset');
