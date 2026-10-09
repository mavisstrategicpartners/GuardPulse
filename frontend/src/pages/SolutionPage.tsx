import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SOLUTIONS } from "../data/solutions";
import { fetchProduct } from "../api/client";
import type { ProductDetail } from "../types";
import { formatZAR } from "../components/ProductCard";

export default function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = SOLUTIONS.find((p) => p.slug === slug);
  const [bundles, setBundles] = useState<ProductDetail[]>([]);

  useEffect(() => {
    if (!page) return;
    document.title = `${page.h1} | GuardPulse`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", page.metaDescription);

    Promise.all(page.bundleSlugs.map((s) => fetchProduct(s).catch(() => null)))
      .then((results) => setBundles(results.filter((p): p is ProductDetail => p !== null)));
  }, [page]);

  if (!page) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Page not found</h1>
        <Link to="/" className="text-amberdeep hover:underline">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="mb-4 font-display text-3xl font-semibold">{page.h1}</h1>
      <blockquote className="mb-2 border-l-2 border-amber pl-4 text-lg italic text-muted">
        "{page.quote}"
      </blockquote>
      <p className="mb-10 text-sm text-muted">— {page.buyerName}</p>

      <div className="mb-12 grid gap-6 sm:grid-cols-2">
        {bundles.map((b) => (
          <Link
            key={b.slug}
            to={`/products/${b.slug}`}
            className="border border-line bg-card p-5 transition-opacity hover:opacity-90"
          >
            <h2 className="mb-1 font-display text-base font-semibold">{b.name}</h2>
            <p className="mb-3 text-sm text-muted">{b.tagline}</p>
            <p className="font-display text-lg font-semibold text-amberdeep">{formatZAR(b.price)}</p>
          </Link>
        ))}
      </div>

      <div className="mb-12 border border-line bg-card p-5">
        <p className="text-sm font-semibold text-navydeep">{page.sayThis}</p>
      </div>

      <h2 className="mb-4 font-display text-xl font-semibold">Common questions</h2>
      <div className="grid gap-5">
        {page.faq.map((item) => (
          <div key={item.question}>
            <h3 className="mb-1 font-display text-sm font-semibold">{item.question}</h3>
            <p className="text-sm text-muted">{item.answer}</p>
          </div>
        ))}
      </div>

      <a
        href="https://wa.me/27842996061"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-block bg-[#25D366] px-5 py-3 font-display text-sm font-semibold text-white"
      >
        Send us a photo on WhatsApp — we'll suggest the right kit
      </a>
    </div>
  );
}