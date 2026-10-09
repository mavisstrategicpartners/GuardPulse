import { useEffect, useState, type FormEvent } from "react";
import { fetchProductReviews, submitProductReview, errorMessage, type ReviewSummary } from "../api/client";

export default function ProductReviews({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setSummary(await fetchProductReviews(slug));
    } catch {
      // leave as null — the section just shows "no reviews yet"
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitProductReview(slug, { authorName: name, rating, comment });
      setName("");
      setComment("");
      setRating(5);
      await load();
    } catch (err) {
      setError(errorMessage(err, "We couldn't post that review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="mb-1 font-display text-xl font-semibold">Customer reviews</h2>
      {summary && summary.count > 0 ? (
        <p className="mb-6 text-sm text-muted">
          {summary.averageRating.toFixed(1)} out of 5 · {summary.count} review{summary.count === 1 ? "" : "s"}
        </p>
      ) : (
        <p className="mb-6 text-sm text-muted">No reviews yet — be the first.</p>
      )}

      <div className="mb-8 grid gap-4">
        {summary?.reviews.map((r) => (
          <div key={r.id} className="border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">{r.authorName}</span>
              <span className="text-xs text-amberdeep">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{r.comment}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid max-w-md gap-3">
        <h3 className="font-display text-sm font-semibold">Leave a review</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="border border-line bg-card px-3 py-2 text-sm"
        />
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border border-line bg-card px-3 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>
          ))}
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think?"
          required
          rows={3}
          className="border border-line bg-card px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-amber px-4 py-2 font-display text-sm font-semibold text-navydeep disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post review"}
        </button>
      </form>
    </div>
  );
}