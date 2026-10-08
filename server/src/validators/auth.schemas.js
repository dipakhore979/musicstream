import { z } from "zod";

const email = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

// bcrypt silently ignores bytes beyond 72, so we cap the length instead of letting that surprise users.
const newPassword = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const otp = z
  .string({ required_error: "Enter the 6-digit code" })
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code");

export const signupSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email,
  password: newPassword,
});

// Login doesn't re-check password strength: old accounts must still be able to sign in.
export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required").max(72),
});

export const verifyEmailSchema = z.object({ email, otp });
export const emailOnlySchema = z.object({ email });
export const resetPasswordSchema = z.object({ email, otp, password: newPassword });
