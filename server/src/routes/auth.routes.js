import { Router } from "express";
import {
  forgotPassword, getMe, login, logout, resendVerification, resetPassword, signup, verifyEmail,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";
import { authLimiter, otpSendLimiter, otpVerifyLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import {
  emailOnlySchema, loginSchema, resetPasswordSchema, signupSchema, verifyEmailSchema,
} from "../validators/auth.schemas.js";

const router = Router();

router.post("/signup", authLimiter, otpSendLimiter, validate(signupSchema), signup);
router.post("/verify-email", otpVerifyLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", otpSendLimiter, validate(emailOnlySchema), resendVerification);

router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);

router.post("/forgot-password", otpSendLimiter, validate(emailOnlySchema), forgotPassword);
router.post("/reset-password", otpVerifyLimiter, validate(resetPasswordSchema), resetPassword);

router.get("/me", protect, getMe);

export default router;
