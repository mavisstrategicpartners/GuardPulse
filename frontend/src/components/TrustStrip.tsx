import { Lock, Truck, Shield, BadgeCheck, Wrench } from "lucide-react";

const ITEMS = [
  { icon: Wrench, text: "Easy DIY install — no technician needed" },
  { icon: Lock, text: "No forced monthly fees — local SD, NAS or optional cloud" },
  { icon: Truck, text: "Nationwide delivery, 2–4 working days" },
  { icon: Shield, text: "12-month supplier warranty on every camera" },
  { icon: BadgeCheck, text: "POPIA-aligned privacy on every order" },
];

export default function TrustStrip() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
        {ITEMS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-2.5">
            <Icon size={17} className="mt-0.5 shrink-0 text-amberdeep" />
            <span className="text-[13px] leading-snug text-[#4A4436]">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}