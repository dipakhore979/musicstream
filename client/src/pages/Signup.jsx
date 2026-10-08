import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import TextField from "../components/ui/TextField.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuthStore } from "../store/authStore.js";
import { getErrorMessage, getFieldErrors } from "../lib/api.js";

export default function Signup() {
  const signup = useAuthStore((s) => s.signup);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const { email } = await signup({ name: form.name, email: form.email, password: form.password });
      toast.success(`We sent a 6-digit code to ${email}`);
      navigate("/verify-email", { state: { email } });
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
      title="Sign up for free"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-white underline hover:text-brand">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <TextField id="name" name="name" label="Name" placeholder="Your name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} required />
        <TextField id="email" name="email" type="email" label="Email" placeholder="name@example.com" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} required />
        <TextField
          id="password" name="password" type="password" label="Password"
          placeholder="At least 8 characters, with a letter and a number"
          autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} required
        />
        <TextField id="confirm" name="confirm" type="password" label="Confirm password" placeholder="Repeat your password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} required />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand py-3 font-bold text-black transition hover:scale-[1.02] hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading && <Spinner size={18} />}
          Continue
        </button>
        <p className="text-center font-sans text-xs text-muted">We'll email you a 6-digit code to confirm your address.</p>
      </form>
    </AuthLayout>
  );
}
