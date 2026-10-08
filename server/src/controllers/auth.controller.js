import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../utils/token.js";
import { consumeOtp, discardAllOtps, discardOtp, invalidCode, isOtpThrottle, issueOtp } from "../utils/otp.js";
import { sendOtpEmail, sendPasswordChangedEmail } from "../utils/emailTemplates.js";

// Creates a code and emails it. If delivery fails the code is discarded, so the user can retry at once.
async function sendCode(user, purpose) {
  const code = await issueOtp(user, purpose);
  try {
    await sendOtpEmail({ user, code, purpose });
  } catch (err) {
    await discardOtp(user._id, purpose);
    console.error(`Failed to send ${purpose} email:`, err.message);
    throw new ApiError(502, "We couldn't send the email. Please try again in a moment.", undefined, "EMAIL_FAILED");
  }
}

// For endpoints that must answer identically whether or not the email exists:
// swallow throttling and delivery errors (they're logged) and never reveal them.
async function sendCodeQuietly(user, purpose) {
  try {
    await sendCode(user, purpose);
  } catch (err) {
    if (!isOtpThrottle(err) && err.code !== "EMAIL_FAILED") console.error(err);
  }
}

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user?.emailVerified) throw ApiError.conflict("An account with this email already exists");

  if (user) {
    // An earlier signup was never verified. Let the owner start over: nothing was lost, and the new
    // code goes to the real inbox, so nobody can claim an address they don't control.
    user.name = name;
    user.password = password;
    await user.save();
  } else {
    // Role is never read from the request body, so nobody can self-assign admin.
    user = await User.create({ name, email, password, emailVerified: false });
  }

  try {
    await sendCode(user, "verify_email");
  } catch (err) {
    if (!isOtpThrottle(err)) throw err; // a code was sent moments ago: carry on to the verify screen
  }

  // No cookie yet: the user can't log in until the email is verified.
  sendSuccess(res, {
    statusCode: 201,
    message: "We sent a verification code to your email",
    data: { email: user.email, requiresVerification: true },
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.emailVerified) throw invalidCode();

  await consumeOtp(user._id, "verify_email", otp);
  user.emailVerified = true;
  await user.save();

  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { message: "Email verified", data: user });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.emailVerified) await sendCodeQuietly(user, "verify_email");
  sendSuccess(res, { message: "If that account needs a code, a new one is on its way." });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  const valid = user && (await user.comparePassword(password));

  // One generic message for both cases so attackers can't discover which emails are registered.
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  if (!user.emailVerified) {
    // Right password, unverified email: send a fresh code and let the client open the verify screen.
    await sendCodeQuietly(user, "verify_email");
    throw new ApiError(403, "Please verify your email to continue", undefined, "EMAIL_NOT_VERIFIED");
  }

  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { message: "Logged in", data: user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) await sendCodeQuietly(user, "reset_password");
  // Same answer whether or not the account exists.
  sendSuccess(res, { message: "If an account exists for that email, we've sent a code." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw invalidCode();
  await consumeOtp(user._id, "reset_password", otp);

  user.password = password; // hashed by the model's pre-save hook
  user.passwordChangedAt = new Date(); // signs out every existing session
  user.emailVerified = true; // they just proved they control this inbox
  await user.save();
  await discardAllOtps(user._id);

  sendPasswordChangedEmail(user).catch((err) => console.error("Failed to send password-changed email:", err.message));

  clearAuthCookie(res);
  sendSuccess(res, { message: "Password updated. Please log in." });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: "Logged out" });
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});
