import mongoose from "mongoose";

// One row per (user, purpose). It stores a keyed hash of the code, never the code itself.
const otpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, enum: ["verify_email", "reset_password"], required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true }, // when the CODE stops working (10 minutes)
  attempts: { type: Number, default: 0 }, // wrong guesses against the current code
  sendCount: { type: Number, default: 1 }, // codes sent in the current hour
  lastSentAt: { type: Date, required: true },
  // When the ROW is deleted (1 hour after the first send). It outlives the code so resend limits
  // can't be dodged by waiting for the code to expire.
  purgeAt: { type: Date, required: true },
});

otpSchema.index({ user: 1, purpose: 1 }, { unique: true });
otpSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB deletes rows automatically

export default mongoose.model("Otp", otpSchema);
