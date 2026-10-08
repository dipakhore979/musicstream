import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import OtpInput from "../components/ui/OtpInput.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuthStore } from "../store/authStore.js";
import { useCountdown } from "../hooks/useCountdown.js";
import { api, getErrorMessage } from "../lib/api.js";

export default function VerifyEmail() {
  const email = useLocation().state?.email;
  const navigate = useNavigate();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, restart] = useCountdown(60); // a code was just sent, so resending is locked for a minute

  // Opened directly (no email in state)? Send them to sign up.
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  const submit = useCallback(
    async (code) => {
      setLoading(true);
      setError("");
      try {
        await verifyEmail({ email, otp: code });
        toast.success("Email verified. Welcome to MusicStream!");
        // GuestRoute redirects Home once the user is set.
      } catch (err) {
        setError(getErrorMessage(err));
        setOtp("");
        setLoading(false);
      }
    },
    [email, verifyEmail]
  );

  // Submit automatically as soon as the sixth digit is in.
  useEffect(() => {
    if (otp.length === 6 && !loading) submit(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function resend() {
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("If your account needs a code, a new one is on its way.");
      setError("");
      setOtp("");
      restart();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  if (!email) return null;

  return (
    <AuthLayout
      title="Check your email"
      footer={
        <>
          Wrong email?{" "}
          <Link to="/signup" className="font-semibold text-white underline hover:text-brand">Sign up again</Link>
          {" · "}
          <Link to="/login" className="font-semibold text-white underline hover:text-brand">Back to login</Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <MailCheck size={40} className="text-brand" />
        <p className="text-muted">
          We sent a 6-digit code to <span className="font-bold text-white">{email}</span>. It expires in 10 minutes.
        </p>

        <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus hasError={Boolean(error)} />

        <div className="min-h-[1.25rem]" aria-live="polite">
          {loading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Spinner size={16} /> Verifying…
            </span>
          )}
          {error && !loading && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <p className="font-sans text-xs text-muted">
          Didn't get it? Check your spam folder, or{" "}
          {seconds > 0 ? (
            <span>request a new code in {seconds}s.</span>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="font-semibold text-white underline hover:text-brand disabled:opacity-60">
              {resending ? "sending…" : "send a new code"}
            </button>
          )}
        </p>
      </div>
    </AuthLayout>
  );
}
