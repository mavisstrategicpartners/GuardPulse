import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { errorMessage } from "../api/client";

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/account";

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;
  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    if (password !== String(form.get("confirm_password"))) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: String(form.get("full_name")).trim(),
        email: String(form.get("email")).trim(),
        phone: String(form.get("phone") ?? "").trim(),
        password,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "We couldn't create your account. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-muted">
        An account lets you see your past orders and fills in your details at checkout. You can still check out as a
        guest at any time.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Full name</label>
          <input
            name="full_name"
            required
            autoComplete="name"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Phone (optional)</label>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Password (at least 8 characters)</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Confirm password</label>
          <input
            name="confirm_password"
            type="password"
            required
            autoComplete="new-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <p className="text-xs text-muted">
          By creating an account you agree to our{" "}
          <Link to="/terms" className="text-amberdeep hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-amberdeep hover:underline">
            Privacy policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 justify-center bg-navydeep px-5 py-2.5 text-center font-display text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" state={{ from }} className="text-amberdeep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}