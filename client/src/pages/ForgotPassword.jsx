import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import TextField from "../components/ui/TextField.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { api, getErrorMessage, getFieldErrors } from "../lib/api.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(useLocation().state?.email ?? "");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const clean = email.trim().toLowerCase();
      await api.post("/auth/forgot-password", { email: clean });
      // The server answers the same way whether or not the account exists.
      toast.success("If an account exists for that email, we've sent a code.");
      navigate("/reset-password", { state: { email: clean } });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      footer={
        <Link to="/login" className="font-semibold text-white underline hover:text-brand">
          Back to login
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-center text-muted">Enter your email and we'll send you a 6-digit code to reset your password.</p>
        <TextField id="email" name="email" type="email" label="Email" placeholder="name@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoFocus required />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full !py-3"
        >
          {loading && <Spinner size={18} />}
          Send code
        </button>
      </form>
    </AuthLayout>
  );
}
