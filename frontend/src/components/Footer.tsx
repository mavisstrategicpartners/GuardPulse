import { Link } from "react-router-dom";

const SHOP_LINKS: { label: string; to: string }[] = [
  { label: "Indoor", to: "/?category=indoor" },
  { label: "Outdoor", to: "/?category=outdoor" },
  { label: "Solar-powered", to: "/?category=solar" },
  { label: "Bundles", to: "/?category=bundle" },
];

const SUPPORT_LINKS: { label: string; to: string }[] = [
  { label: "Track your order", to: "/track-order" },
  { label: "Warranty & returns", to: "/returns" },
  { label: "Delivery info", to: "/delivery" },
  { label: "Privacy policy", to: "/privacy" },
  { label: "Terms of service", to: "/terms" },
  { label: "Contact us", to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="mt-10 bg-navydeep text-[#9E9788]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-11 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="font-display text-lg font-bold text-paper">GuardPulse</span>
          <p className="mt-2.5 max-w-[280px] text-[13px] leading-relaxed">
            Security cameras for South African homes — chosen, tested and shipped locally.
          </p>
        </div>
        <div>
          <p className="mb-2.5 text-xs text-paper">Shop</p>
          {SHOP_LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="block my-1.5 text-[13px] hover:text-paper">
              {l.label}
            </Link>
          ))}
        </div>
        <div>
          <p className="mb-2.5 text-xs text-paper">Support</p>
          {SUPPORT_LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="block my-1.5 text-[13px] hover:text-paper">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-[#2A3548] p-4 text-center text-xs">
        © {new Date().getFullYear()} GuardPulse · nationwide delivery across South Africa
      </div>
    </footer>
  );
}
