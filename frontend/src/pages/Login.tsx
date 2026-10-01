import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { errorMessage } from "../api/client";

export default function Login() {
  const { user, loading, login } = useAuth();
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
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await login(String(form.get("email")).trim(), String(form.get("password")));
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "We couldn't log you in. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-semibold">Log in</h1>
      <p className="mb-6 text-sm text-muted">Welcome back. Log in to see your orders and check out faster.</p>

      <form onSubmit={handleSubmit} className="grid gap-4">
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
          <label className="mb-1 block text-[13px] text-[#5C5545]">Password</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 justify-center bg-navydeep px-5 py-2.5 text-center font-display text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link to="/register" state={{ from }} className="text-amberdeep hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}