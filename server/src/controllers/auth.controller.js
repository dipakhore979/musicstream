import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../utils/token.js";

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict("An account with this email already exists");
  }

  // Role is never read from the request body, so nobody can self-assign admin.
  const user = await User.create({ name, email, password });

  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { statusCode: 201, message: "Account created", data: user });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  const valid = user && (await user.comparePassword(password));

  // One generic message for both cases so attackers can't discover which emails are registered.
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  setAuthCookie(res, signToken(user._id));
  sendSuccess(res, { message: "Logged in", data: user });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  sendSuccess(res, { message: "Logged out" });
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: req.user });
});
