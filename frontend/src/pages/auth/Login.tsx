import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../api/AuthContext";

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || "We couldn't log you in — check your details and try again.";
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/account";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 font-display text-2xl font-semibold">Log in</h1>

      {error && (
        <div className="mb-4 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
      )}

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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-[13px] text-[#5C5545]">Password</label>
            <Link to="/forgot-password" className="text-[13px] text-amberdeep hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-navydeep px-5 py-2.5 font-display text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Don't have an account?{" "}
        <Link to="/register" className="text-amberdeep hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}