import { useEffect, useState } from "react";
import { fetchProducts } from "../api/client";
import type { ProductSummary } from "../types";
import ProductCard from "./ProductCard";
import { FILTERS } from "./Header";

interface Props {
  filter: string;
  onViewDetails: (slug: string) => void;
}

// Free-tier hosting (e.g. Render) can take 30-60s to wake up from a cold start, and
// sometimes answers with a transient error while it's coming up rather than just being
// slow. Retrying a few times with backoff covers both cases instead of giving up on the
// very first failure and showing a scary "is the server running?" message for something
// that's actually just waking up.
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 15000]; // between attempts 1→2, 2→3, 3→4, 4→5

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ProductGrid({ filter, onViewDetails }: Props) {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWaking(false);
    setError(null);

    const params =
      filter === "all" ? undefined : filter === "bundle" ? { bundle: true } : { category: filter as never };

    (async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const data = await fetchProducts(params);
          if (!cancelled) {
            setProducts(data);
            setLoading(false);
            setWaking(false);
          }
          return;
        } catch {
          if (cancelled) return;
          if (attempt === MAX_ATTEMPTS) {
            setError("Couldn't reach the store right now. Please try again in a moment.");
            setLoading(false);
            setWaking(false);
            return;
          }
          // First failure could just be the backend waking up from sleep — say so rather
          // than alarming the customer, then back off and try again.
          setWaking(true);
          await wait(RETRY_DELAYS_MS[attempt - 1]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filter, retryToken]);

  const label = FILTERS.find((f) => f.key === filter)?.label ?? "All cameras";

  return (
    <section id="catalog" className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-7 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-semibold">{label}</h2>
        {!loading && !error && (
          <span className="text-[13px] text-muted">
            {products.length} camera{products.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && !waking && <p className="text-sm text-muted">Loading cameras…</p>}
      {loading && waking && (
        <p className="text-sm text-muted">
          Waking up the store — this can take up to a minute on the first visit after a while. Hang tight…
        </p>
      )}

      {error && (
        <div>
          <p className="mb-3 text-sm text-red-700">{error}</p>
          <button
            onClick={() => setRetryToken((t) => t + 1)}
            className="bg-navydeep px-4 py-2 font-display text-sm text-paper"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onViewDetails={onViewDetails} />
          ))}
        </div>
      )}
    </section>
  );
}