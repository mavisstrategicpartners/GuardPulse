import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../api/CartContext";
import type { Category } from "../types";

export const FILTERS: { key: Category | "all" | "bundle"; label: string }[] = [
  { key: "all", label: "All cameras" },
  { key: "indoor", label: "Indoor" },
  { key: "outdoor", label: "Outdoor" },
  { key: "solar", label: "Solar-powered" },
  { key: "bundle", label: "Bundles" },
];

export default function Header() {
  const { itemCount, openCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const activeFilter =
    location.pathname === "/" ? new URLSearchParams(location.search).get("category") ?? "all" : "";

  function goToFilter(key: string) {
    navigate(key === "all" ? "/" : `/?category=${key}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26">
            <circle cx="13" cy="13" r="10" fill="none" stroke="var(--color-amberdeep)" strokeWidth="1.6" />
            <circle cx="13" cy="13" r="3" fill="var(--color-amberdeep)" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight text-ink">GuardPulse</span>
        </Link>

        <nav className="hidden gap-7 md:flex">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => goToFilter(f.key)}
              className={`border-b-2 pb-1 text-sm transition-colors ${
                activeFilter === f.key
                  ? "border-amberdeep text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </nav>

        <button
          onClick={openCart}
          className="inline-flex items-center gap-2 bg-navydeep px-5 py-2.5 text-sm font-medium font-display text-paper transition-opacity hover:opacity-85"
        >
          <ShoppingCart size={16} />
          {itemCount > 0 ? `Cart · ${itemCount}` : "Cart"}
        </button>
      </div>
    </header>
  );
}
