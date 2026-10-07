import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/client";

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await requestPasswordReset(String(form.get("email")));
    } finally {
      // Always show the same confirmation, whether or not the email has an account —
      // the backend behaves the same way for the same reason (see AuthController).
      setSent(true);
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted">
          If that email has a GuardPulse account, we've sent a link to reset the password.
          It's valid for 1 hour.
        </p>
        <Link to="/login" className="mt-8 inline-block bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-2 font-display text-2xl font-semibold">Forgot your password?</h1>
      <p className="mb-6 text-sm text-muted">Enter your email and we'll send you a link to reset it.</p>

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
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-navydeep px-5 py-2.5 font-display text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        <Link to="/login" className="text-amberdeep hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}