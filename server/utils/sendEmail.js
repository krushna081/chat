import axios from 'axios';

export const sendOTPEmail = async (email, otp) => {
  try {
    const fromAddress = process.env.EMAIL_FROM || 'SecureChat <onboarding@krushna081.online>';
    const recipient = (process.env.NODE_ENV !== 'production' && process.env.RESEND_TEST_EMAIL)
      ? process.env.RESEND_TEST_EMAIL
      : email;

    const response = await axios.post('https://api.resend.com/emails', {
      from: fromAddress,
      to: recipient,
      subject: 'Verify Your SecureChat Account',
      html: generateOTPEmailTemplate(otp),
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Email sending error:', error?.response?.data || error.message || error);
    const resendMsg = error?.response?.data?.message;
    throw new Error(resendMsg ? `Failed to send OTP email: ${resendMsg}` : 'Failed to send OTP email');
  }
};

const generateOTPEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00ff88, #00d4ff); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; color: #000; }
          .content { background: #2a2a2a; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: #00ff88; color: #000; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0; }
          .warning { background: #ff4444; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 SecureChat Verification</h1>
          </div>
          <div class="content">
            <p>Welcome to SecureChat!</p>
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-box">${otp}</div>
            <p>This OTP will expire in 5 minutes.</p>
            <div class="warning">
              ⚠️ Never share this code with anyone. SecureChat support will never ask for your OTP.
            </div>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
              <p>&copy; 2024 SecureChat. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
