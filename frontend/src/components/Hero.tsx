function HeroGraphic() {
  return (
    <svg viewBox="0 0 520 360" width="100%" style={{ maxWidth: 460 }}>
      <polygon points="60,220 260,90 460,220 460,320 60,320" fill="none" stroke="#2A3548" strokeWidth="1.4" />
      <line x1="60" y1="220" x2="460" y2="220" stroke="#2A3548" strokeWidth="1.4" />
      <rect x="120" y="250" width="46" height="70" fill="none" stroke="#2A3548" strokeWidth="1.4" />
      <rect x="350" y="250" width="40" height="40" fill="none" stroke="#2A3548" strokeWidth="1.4" />
      <g>
        <circle cx="392" cy="196" r="26" fill="none" stroke="var(--color-amber)" strokeWidth="1.6" />
        <circle cx="392" cy="196" r="26" fill="var(--color-amber)" opacity="0.08" />
        <circle cx="392" cy="196" r="10" stroke="var(--color-amber)" strokeWidth="1.6" fill="none" />
        <circle cx="392" cy="196" r="3" fill="var(--color-amber)" />
        <circle cx="392" cy="196" r="42" stroke="var(--color-amber)" strokeWidth="0.8" opacity="0.35" fill="none" />
        <circle cx="392" cy="196" r="58" stroke="var(--color-amber)" strokeWidth="0.8" opacity="0.18" fill="none" />
      </g>
      <path d="M392 222 L392 260" stroke="#2A3548" strokeWidth="1.4" />
    </svg>
  );
}

interface Props {
  onShopClick: () => void;
  onSolarClick: () => void;
}

export default function Hero({ onShopClick, onSolarClick }: Props) {
  return (
    <section className="bg-navydeep text-paper">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div>
          <p className="mb-4 text-sm text-amber">Home security for South African homes</p>
          <h1 className="max-w-[480px] font-display text-4xl font-semibold leading-tight md:text-5xl">
            See what happens after dark.
          </h1>
                   <p className="mt-5 max-w-[420px] text-base leading-relaxed text-[#C7C2B6]">
            Indoor, outdoor and solar-powered cameras that store footage locally — no forced monthly fees,
            no blind spots, built for load shedding and South African heat alike.
          </p>
          <p className="mt-3 max-w-[420px] text-base font-medium leading-relaxed text-paper">
            No technician needed — mount it, plug it in and set it up yourself in minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <button
              onClick={onShopClick}
              className="inline-flex items-center gap-2 bg-amber px-5 py-2.5 font-display text-sm font-semibold text-navydeep transition-opacity hover:opacity-85"
            >
              Shop the range
            </button>
            <button
              onClick={onSolarClick}
              className="inline-flex items-center gap-2 border border-white/35 px-5 py-2.5 font-display text-sm font-semibold text-paper transition-opacity hover:opacity-85"
            >
              Solar-powered kits
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <HeroGraphic />
        </div>
      </div>
    </section>
  );
}
