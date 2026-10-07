import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/AuthContext";

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || "We couldn't create that account — check your details and try again.";
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await register({
        full_name: String(form.get("full_name")),
        email: String(form.get("email")),
        phone: String(form.get("phone") ?? ""),
        password: String(form.get("password")),
      });
      navigate("/account", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 font-display text-2xl font-semibold">Create an account</h1>

      {error && (
        <div className="mb-4 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Full name</label>
          <input
            name="full_name"
            type="text"
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
          <label className="mb-1 block text-[13px] text-[#5C5545]">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-navydeep px-5 py-2.5 font-display text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-amberdeep hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}