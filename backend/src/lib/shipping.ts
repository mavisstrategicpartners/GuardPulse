import { config } from "../config.js";
import { q } from "../db.js";

export interface WeightedItem { quantity: number; weight_kg: number }

/** Total weight in grams (integer) so tier boundaries never wobble on float error. */
export function totalWeightGrams(items: WeightedItem[]): number {
  return items.reduce((a, i) => a + Math.round(i.weight_kg * 1000) * i.quantity, 0);
}

/** Weight-tiered fee, whole Rand (HALF_UP) — the fallback when the courier can't be asked. */
export function feeForWeightGrams(grams: number): number {
  const s = config().shipping;
  const kg = grams / 1000;
  let fee: number;
  if (grams <= s.tier1MaxKg * 1000) fee = s.tier1Fee;
  else if (grams <= s.tier2MaxKg * 1000) fee = s.tier2Fee;
  else if (grams <= s.tier3MaxKg * 1000) fee = s.tier3Fee;
  else if (grams <= s.tier4MaxKg * 1000) fee = s.tier4Fee;
  else fee = s.tier4Fee + (kg - s.tier4MaxKg) * s.overTier4RatePerKg;
  return Math.floor(fee + 0.5);
}

export interface Address { street?: string; city?: string; province?: string; postalCode?: string }

function courierConfigured(): boolean {
  const c = config().courier;
  return !!c.apiKey && !!c.collect.code;
}

const addr = (type: string, company: string, street: string, area: string, city: string, zone: string, code: string) =>
  ({ type, company, street_address: street, local_area: area, city, zone, country: "ZA", code });

/** Cheapest allowed service, whole Rand, VAT included. null on any failure. */
export async function courierQuote(a: Address, weightKg: number): Promise<number | null> {
  if (!courierConfigured()) return null;
  const c = config().courier;
  try {
    const res = await fetch(`${c.baseUrl}/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `${c.authScheme} ${c.apiKey}`.trim() },
      body: JSON.stringify({
        collection_address: addr("business", c.collect.company, c.collect.street, c.collect.area, c.collect.city, c.collect.zone, c.collect.code),
        delivery_address: addr("residential", "", a.street ?? "", a.city ?? "", a.city ?? "", a.province ?? "", (a.postalCode ?? "").trim()),
        parcels: [{ submitted_length_cm: c.box.l, submitted_width_cm: c.box.w, submitted_height_cm: c.box.h, submitted_weight_kg: weightKg }],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: any = await res.json();
    let best: number | null = null;
    for (const r of data.rates ?? []) {
      if (c.excludeCodes.includes(r?.service_level?.code)) continue;
      const rate = Number(r.rate);
      if (Number.isFinite(rate) && (best === null || rate < best)) best = rate;
    }
    return best === null ? null : Math.ceil(best);
  } catch (e) {
    console.warn("Courier Guy rate lookup failed, using weight tiers:", (e as Error).message);
    return null;
  }
}

/** Live courier rate when we have a full address, otherwise the weight tiers. */
export async function quoteShipping(items: WeightedItem[], a: Address): Promise<{ fee: number; weightKg: number }> {
  const grams = totalWeightGrams(items);
  const weightKg = grams / 1000;
  const haveAddress = (a.postalCode ?? "").trim().length === 4 && !!(a.city ?? "").trim();
  if (haveAddress) {
    const live = await courierQuote(a, weightKg);
    if (live !== null) return { fee: live, weightKg };
  }
  return { fee: feeForWeightGrams(grams), weightKg };
}

export async function cartItemsForShipping(cartId: number): Promise<WeightedItem[]> {
  return q<WeightedItem>(
    `SELECT ci.quantity, p.weight_kg FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = $1`,
    [cartId],
  );
}
