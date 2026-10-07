import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/client";

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || "That link didn't work — request a new one.";
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (newPassword !== confirm) {
      setError("Those passwords don't match.");
      setSubmitting(false);
      return;
    }
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Invalid link</h1>
        <p className="mb-8 text-sm text-muted">
          This reset link is missing its token. Request a new one from the login page.
        </p>
        <Link to="/forgot-password" className="bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Password reset</h1>
        <p className="mb-8 text-sm text-muted">
          Your password has been changed and you've been logged out everywhere. Log in with your new password.
        </p>
        <Link to="/login" className="bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 font-display text-2xl font-semibold">Choose a new password</h1>

      {error && (
        <div className="mb-4 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">New password</label>
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
        <div>
          <label className="mb-1 block text-[13px] text-[#5C5545]">Confirm new password</label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-line bg-card px-3 py-2.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-navydeep px-5 py-2.5 font-display text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {submitting ? "Resetting…" : "Reset password"}
        </button>
      </form>
    </div>
  );
}