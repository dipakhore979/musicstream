import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import TextField from "../components/ui/TextField.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuthStore } from "../store/authStore.js";
import { getErrorMessage, getFieldErrors } from "../lib/api.js";

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await login(form);
      toast.success("Welcome back!");
      // GuestRoute redirects once the user is set in the store.
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        // The server just emailed a fresh code; continue on the verification screen.
        toast("Please verify your email. We sent you a new code.");
        navigate("/verify-email", { state: { email: form.email.trim().toLowerCase() } });
        return;
      }
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Log in to MusicStream"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-white underline hover:text-brand">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField id="email" name="email" type="email" label="Email" placeholder="name@example.com" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} required />
        <div>
          <TextField id="password" name="password" type="password" label="Password" placeholder="Your password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} required />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" state={{ email: form.email }} className="font-sans text-xs text-muted underline hover:text-white">
              Forgot password?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full !py-3"
        >
          {loading && <Spinner size={18} />}
          Log in
        </button>
      </form>
    </AuthLayout>
  );
}
