import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  submitOrder,
  initPayFastPayment,
  redirectToPayFast,
  fetchStoreInfo,
  fetchShippingQuote,
  errorMessage,
  type StoreInfo,
} from "../api/client";
import type { Order } from "../types";
import { useAuth } from "../api/AuthContext";
import { useCart } from "../api/CartContext";
import { formatZAR } from "../components/ProductCard";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

export default function Checkout() {
  const { cart, refresh } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [shippingFee, setShippingFee] = useState<number | null>(null);

  useEffect(() => {
    fetchStoreInfo().then(setStoreInfo).catch(() => {});
  }, []);

  // Live shipping estimate — recalculated whenever the cart's contents change. The final
  // charge is always the server's own calculation at checkout time, not this preview.
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setShippingFee(null);
      return;
    }
    let cancelled = false;
    fetchShippingQuote(cart.token)
      .then((quote) => {
        if (!cancelled) setShippingFee(quote.fee);
      })
      .catch(() => {
        if (!cancelled) setShippingFee(null);
      });
    return () => {
      cancelled = true;
    };
  }, [cart?.token, cart?.items]);

  const items = cart?.items ?? [];
  const subtotal = parseFloat(String(cart?.total ?? "0"));
  const total = shippingFee === null ? null : subtotal + shippingFee;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cart) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    // Step 1: create the order (this reserves the stock).
    let order: Order;
    try {
      order = await submitOrder({
        cart_token: cart.token,
        full_name: String(form.get("full_name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        address_line1: String(form.get("address_line1")),
        address_line2: String(form.get("address_line2") ?? ""),
        city: String(form.get("city")),
        province: String(form.get("province")),
        postal_code: String(form.get("postal_code")),
        // No shipping_fee here — the backend computes it from the cart's real weight.
      });
    } catch (err) {
      setError(errorMessage(err, "We couldn't place that order. Check the fields and try again."));
      setSubmitting(false);
      return;
    }

    // The backend emptied the cart; pull a fresh one. A hiccup here must not block payment.
    try {
      await refresh();
    } catch {
      // ignore
    }

    // Step 2: hand off to PayFast — this navigates the browser away.
    try {
      const payfastInit = await initPayFastPayment(order.reference);
      redirectToPayFast(payfastInit);
    } catch {
      // The order exists, so don't ask them to fill the form in again (that would create a duplicate
      // order). Send them to the order page, which has a "Pay now" button.
      navigate(`/order/${order.reference}`);
    }
  }

  if (authLoading) {
    return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Your cart is empty</h1>
        <p className="mb-6 text-sm text-muted">Add a camera before checking out.</p>
        <Link to="/" className="bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
          Browse cameras
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 md:grid-cols-[1.3fr_1fr]">
      <div>
        <h1 className="mb-2 font-display text-2xl font-semibold">Delivery details</h1>
        {user ? (
          <p className="mb-6 text-sm text-muted">Checking out as {user.email}. This order will appear in your account.</p>
        ) : (
          <p className="mb-6 text-sm text-muted">
            Have an account?{" "}
            <Link to="/login" state={{ from: "/checkout" }} className="text-amberdeep hover:underline">
              Log in
            </Link>{" "}
            to fill in your details and keep track of this order — or just carry on as a guest.
          </p>
        )}
        <form id="checkout-form" key={user?.id ?? "guest"} onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Full name" name="full_name" required defaultValue={user?.full_name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" name="email" type="email" required defaultValue={user?.email} />
            <Field label="Phone" name="phone" type="tel" required defaultValue={user?.phone ?? undefined} />
          </div>
          <Field label="Address line 1" name="address_line1" required />
          <Field label="Address line 2 (optional)" name="address_line2" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" name="city" required />
            <div>
              <label className="mb-1 block text-[13px] text-[#5C5545]">Province</label>
              <select
                name="province"
                required
                defaultValue=""
                className="w-full border border-line bg-card px-3 py-2.5 text-sm"
              >
                <option value="" disabled>
                  Select…
                </option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Field label="Postal code" name="postal_code" required />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <p className="mt-2 text-xs text-muted">
            You'll be taken to PayFast to complete payment securely. We never see or store your card details.
          </p>

          <button
            type="submit"
            disabled={submitting || total === null}
            className="mt-2 justify-center bg-amber px-5 py-3 text-center font-display text-sm font-semibold text-navydeep transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {submitting
              ? "Redirecting to PayFast…"
              : total === null
                ? "Calculating shipping…"
                : `Pay with PayFast — ${formatZAR(total)}`}
          </button>
        </form>
      </div>

      <aside className="h-fit border border-line bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Order summary</h2>
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-[13.5px]">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatZAR(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-[13.5px] text-muted">
          <span>Shipping (RAM)</span>
          <span>{shippingFee === null ? "Calculating…" : formatZAR(shippingFee)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-line pt-3 font-display text-base font-semibold">
          <span>Total</span>
          <span>{total === null ? "—" : formatZAR(total)}</span>
        </div>
        {storeInfo && (
          <p className="mt-3 text-xs text-muted">
            {storeInfo.prices_include_vat
              ? `Prices include ${storeInfo.vat_rate_percent}% VAT.`
              : `${storeInfo.vat_rate_percent}% VAT will be added.`}
            {storeInfo.vat_number && ` VAT No: ${storeInfo.vat_number}.`}
          </p>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] text-[#5C5545]">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-line bg-card px-3 py-2.5 text-sm"
      />
    </div>
  );
}