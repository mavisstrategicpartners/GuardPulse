export interface SolutionPage {
  slug: string; // URL: /solutions/<slug>
  h1: string;
  metaDescription: string;
  buyerName: string;
  quote: string;
  sayThis: string;
  bundleSlugs: string[]; // Product.slug values — must exist in the catalog
  faq: { question: string; answer: string }[];
}

export const SOLUTIONS: SolutionPage[] = [
  {
    slug: "family-home-security",
    h1: "Family home security you set up yourself",
    metaDescription:
      "Wi-Fi camera and wireless alarm bundles for family homes. Memory cards included, set up yourself in an afternoon, no contract.",
    buyerName: "Thabo & Lerato, IT technician and nurse, Randburg",
    quote: "We just want to see the kids and the yard from work, and get a ping if someone is at the back door.",
    sayThis: "Two rooms covered, cards included, set up in an afternoon, no contract.",
    bundleSlugs: ["two-room-tapo-camera-pack", "hikvision-whole-house-wireless-alarm-bundle", "tapo-door-and-window-alert-kit"],
    faq: [
      { question: "Do I need an installer?", answer: "No. Every kit here is designed to fit yourself — cameras pair over Wi-Fi in minutes, and the wireless alarm is self-install with no wiring." },
      { question: "Does it work without the cloud?", answer: "Yes. Each camera records to its own memory card, so you can play back footage without paying for a subscription." },
    ],
  },
  {
    slug: "baby-and-pet-camera",
    h1: "See your baby and pets from your phone",
    metaDescription:
      "Watch your baby or pet from your phone with two-way talk and a motion night light. No drilling, no subscription, memory card included.",
    buyerName: "Naledi, marketing coordinator, Centurion",
    quote: "I need to check on the baby and the dog without getting up every five minutes, and I can't drill holes in a rented flat.",
    sayThis: "Plug it in, open the app, see your baby. No drilling, no subscription.",
    bundleSlugs: ["baby-and-pet-room-camera-bundle", "ready-to-record-home-camera-bundle"],
    faq: [
      { question: "Is my video private?", answer: "Recordings stay on the camera's own memory card unless you choose to pay for cloud storage — nothing is shared by default." },
      { question: "Do I need to drill into the wall?", answer: "No — these cameras stand on a shelf or surface. Nothing here requires drilling or wiring." },
    ],
  },
  {
    slug: "solar-farm-security",
    h1: "Solar security for farms, gates and smallholdings",
    metaDescription:
      "4K solar camera and solar flood lights for gates, pump houses and smallholdings with no power. No wiring, see it live on your phone.",
    buyerName: "Johan, smallholding farmer, near Hartbeespoort",
    quote: "There's no power at the gate or the pump house. If it needs an electrician out here, forget it.",
    sayThis: "Solar powered, no wiring, see your gate on your phone tonight.",
    bundleSlugs: ["solar-security-camera-bundle", "outdoor-night-watch-bundle"],
    faq: [
      { question: "Will it work on cloudy days, and at the gate?", answer: "The battery is rated for weeks without direct sun once charged; position the solar panel facing north for the most charge through winter." },
      { question: "How many cloudy days does the battery last?", answer: "Manufacturer figures put it at several weeks on a full charge with no sun at all — a few overcast days won't be noticeable." },
    ],
  },
  {
    slug: "shop-security-load-shedding",
    h1: "Shop security that keeps recording in load-shedding",
    metaDescription:
      "Keep your shop camera recording when the power goes. Camera, mini UPS and memory card in one kit. Watch the till from home, no cloud fees.",
    buyerName: "Sipho, spaza shop owner, Soweto",
    quote: "When the power goes, the cameras must still record. That's when trouble comes.",
    sayThis: "Keeps recording through load-shedding. You watch the shop from home.",
    bundleSlugs: ["load-shedding-camera-bundle", "hikvision-whole-house-wireless-alarm-bundle"],
    faq: [
      { question: "How long will it run with no power?", answer: "The mini UPS runs a router and the camera for a few hours per outage — enough to cover a typical load-shedding stage." },
      { question: "Can I watch the shop from home?", answer: "Yes — the camera streams to the app on your phone from anywhere there's internet, not just on-site." },
    ],
  },
  {
    slug: "airbnb-and-rental-smart-lock",
    h1: "Keyless check-in for hosts and landlords",
    metaDescription:
      "Keyless check-in with a keypad smart lock and a 2K video doorbell. Fit it yourself, send guest codes and see arrivals from your phone.",
    buyerName: "Ayesha, Airbnb host and landlord, northern Johannesburg suburbs",
    quote: "Every time a guest loses a key, I drive across town. I want to send a code, not a person.",
    sayThis: "Send guests a code, see them arrive, no keys and no trips.",
    bundleSlugs: ["xiaomi-front-door-bundle", "away-from-home-tapo-bundle"],
    faq: [
      { question: "Will it fit my door?", answer: "The self-install lock fits most standard door thicknesses — check your door's thickness against the product page before ordering if you're unsure." },
      { question: "What if the battery runs flat?", answer: "Both the lock and doorbell warn you in-app well before the battery runs out, and the lock still opens by keypad code during a recharge." },
    ],
  },
  {
    slug: "dash-cam-bundles",
    h1: "Dash cams that record from your first drive",
    metaDescription:
      "2K dash cam bundles with the memory card included. Sticks on in two minutes, records from your first drive, clips straight to your phone.",
    buyerName: "Kagiso, sales rep, Midrand",
    quote: "If someone crashes into me, I want proof on my phone, not an argument.",
    sayThis: "Card included, sticks on in two minutes, recording from your first drive.",
    bundleSlugs: ["dash-cam-starter-bundle", "all-day-dash-cam-bundle"],
    faq: [
      { question: "Will it drain my car battery?", answer: "No — it runs from the car's accessory power while the engine is on or the ignition is in accessory mode, not a separate battery." },
      { question: "Which memory card does my dash cam need?", answer: "Any card included in these bundles is already matched to the camera's recommended speed class — no extra research needed." },
    ],
  },
  {
    slug: "peace-of-mind-for-parents",
    h1: "Peace of mind for parents who live alone",
    metaDescription:
      "Quiet door and motion alerts sent to your phone, a night light for safer walking and a panic button. Easy for parents, set up in one visit.",
    buyerName: "Linda, finance manager, Johannesburg (mother lives alone in Pretoria)",
    quote: "Mom wants to stay in her own home. I just need to know she's up and moving every morning.",
    sayThis: "Quiet alerts on your phone. Mom keeps her independence.",
    bundleSlugs: ["xiaomi-door-and-window-alert-kit", "baby-and-pet-room-camera-bundle"],
    faq: [
      { question: "Is it private? Does Mom need a smartphone?", answer: "No smartphone needed on her side — the sensors just need power and Wi-Fi; alerts go only to your phone, not anywhere public." },
      { question: "Will Mom manage it?", answer: "There's nothing for her to operate day to day — sensors work silently in the background and only you get notified." },
    ],
  },
];