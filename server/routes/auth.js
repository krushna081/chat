import express from 'express';
import * as authController from '../controllers/authController.js';
import { authLimiter, loginLimiter, otpLimiter, resendLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/signup', authLimiter, authController.signup);
router.post('/verify-otp', otpLimiter, authController.verifyOtpAndCreateUser);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refreshAccessToken);
router.post('/logout', authController.logout);
router.post('/resend-otp', resendLimiter, authController.resendOtp);

router.post('/forgot-password-request', resendLimiter, authController.forgotPasswordRequest);
router.post('/verify-reset-otp', otpLimiter, authController.verifyResetOtp);

export default router;
