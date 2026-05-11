import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOtpAndCreateUser);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshAccessToken);
router.post('/logout', authController.logout);
router.post('/resend-otp', authController.resendOtp);

// OTP Password Reset
router.post('/forgot-password-request', authController.forgotPasswordRequest);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

export default router;
