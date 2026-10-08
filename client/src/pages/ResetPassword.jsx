import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import OtpInput from "../components/ui/OtpInput.jsx";
import TextField from "../components/ui/TextField.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useCountdown } from "../hooks/useCountdown.js";
import { api, getErrorMessage, getFieldErrors } from "../lib/api.js";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(useLocation().state?.email ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, restart] = useCountdown(60);

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await api.post("/auth/reset-password", { email: email.trim().toLowerCase(), otp, password });
      toast.success("Password updated. Log in with your new password.");
      navigate("/login", { replace: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else {
        // Wrong or expired code: show it under the boxes and let them retype.
        setErrors({ otp: getErrorMessage(err) });
        setOtp("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email.trim()) {
      setErrors({ email: "Enter your email first" });
      return;
    }
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      toast.success("If an account exists for that email, we've sent a new code.");
      setErrors({});
      setOtp("");
      restart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      footer={
        <Link to="/login" className="font-semibold text-white underline hover:text-brand">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-center text-muted">Enter the 6-digit code we emailed you, then choose a new password.</p>

        <TextField id="email" name="email" type="email" label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />

        <div>
          <span className="mb-2 block text-sm font-semibold">Code</span>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus={Boolean(email)} hasError={Boolean(errors.otp)} />
          {errors.otp && <p className="mt-2 text-center text-sm text-red-400">{errors.otp}</p>}
        </div>

        <TextField
          id="password" name="password" type="password" label="New password"
          placeholder="At least 8 characters, with a letter and a number"
          autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} required
        />
        <TextField id="confirm" name="confirm" type="password" label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} required />

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="btn-primary mt-2 w-full !py-3"
        >
          {loading && <Spinner size={18} />}
          Reset password
        </button>

        <p className="text-center font-sans text-xs text-muted">
          Didn't get a code? Check spam, or{" "}
          {seconds > 0 ? (
            <span>request a new one in {seconds}s.</span>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="font-semibold text-white underline hover:text-brand disabled:opacity-60">
              {resending ? "sending…" : "send a new code"}
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
