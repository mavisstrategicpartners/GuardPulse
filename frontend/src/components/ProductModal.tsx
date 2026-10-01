import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchProduct, resolveImageUrl } from "../api/client";
import type { ProductDetail as ProductDetailType } from "../types";
import CameraMark from "./CameraMark";
import { formatZAR } from "./ProductCard";
import { useCart } from "../api/CartContext";

interface Props {
  slug: string;
  onClose: () => void;
}

/** Spec lines arrive as "Label: detail". Show the label in bold; lines without one are shown as-is. */
function splitSpec(text: string): { label: string | null; detail: string } {
  const idx = text.indexOf(": ");
  if (idx > 0 && idx <= 24) {
    return { label: text.slice(0, idx), detail: text.slice(idx + 2) };
  }
  return { label: null, detail: text };
}

export default function ProductModal({ slug, onClose }: Props) {
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const { addItem, openCart } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetchProduct(slug).then((data) => {
      if (!cancelled) setProduct(data);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const imageUrl = product ? resolveImageUrl(product.image) : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center bg-navydeep/60 p-4 sm:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto bg-card p-6 sm:p-8"
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 text-ink" aria-label="Close">
          <X size={18} />
        </button>

        {!product ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : (
          <>
            <div className="mb-4 flex h-52 w-full items-center justify-center bg-paper">
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="h-full w-full object-contain p-4" />
              ) : (
                <CameraMark category={product.category} size={64} />
              )}
            </div>

            <p className="text-xs text-[#8A8272]">{product.brand === "xiaomi" ? "Xiaomi" : "TP-Link"}</p>
            <h3 className="mb-1.5 mt-1 font-display text-xl font-semibold">{product.name}</h3>
            <p className="mb-3 text-sm font-medium text-[#3A3527]">{product.tagline}</p>
            {product.description && (
              <p className="mb-5 text-[13.5px] leading-relaxed text-[#5C5545]">{product.description}</p>
            )}

            <h4 className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-amberdeep">
              What it can do
            </h4>
            <ul className="m-0 list-none p-0">
              {product.specs.map((s, i) => {
                const { label, detail } = splitSpec(s.text);
                return (
                  <li key={i} className="border-t border-line py-2.5 text-[13.5px] leading-snug text-[#3A3527]">
                    {label ? (
                      <>
                        <span className="font-semibold text-ink">{label}</span>
                        <span className="text-[#5C5545]"> — {detail}</span>
                      </>
                    ) : (
                      detail
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
              <span className="font-display text-xl font-semibold">{formatZAR(product.price)}</span>
              <button
                onClick={() => {
                  addItem(product.slug);
                  onClose();
                  openCart();
                }}
                className="bg-amber px-5 py-2.5 font-display text-sm font-semibold text-navydeep transition-opacity hover:opacity-85"
              >
                Add to cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}