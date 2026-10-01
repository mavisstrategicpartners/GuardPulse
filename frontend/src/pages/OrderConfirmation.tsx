import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchOrder, initPayFastPayment, redirectToPayFast } from "../api/client";
import type { Order } from "../types";
import { formatZAR } from "../components/ProductCard";

const POLL_EVERY_MS = 4000;
const MAX_POLLS = 45; // about 3 minutes of waiting for PayFast to confirm

export default function OrderConfirmation() {
  const { reference } = useParams<{ reference: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Load the order, and while it is still waiting for payment keep checking: PayFast confirms the
  // payment to our server a few seconds after the customer returns, and this page should show that.
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    async function load() {
      try {
        const o = await fetchOrder(reference!);
        if (cancelled) return;
        setOrder(o);
        setError(false);
        if (o.status === "pending" && polls < MAX_POLLS) {
          polls += 1;
          timer = setTimeout(load, POLL_EVERY_MS);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference]);

  async function payNow() {
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const init = await initPayFastPayment(order.reference);
      redirectToPayFast(init);
    } catch {
      setPayError("We couldn't reach PayFast just now. Please try again in a moment.");
      setPaying(false);
    }
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="mb-3 font-display text-2xl font-semibold">Order not found</h1>
        <Link to="/" className="bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!order) return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;

  const statusCopy: Record<string, { label: string; note: string }> = {
    pending: {
      label: "Waiting for payment",
      note: "If you've just paid, we're waiting for PayFast to confirm it — this page updates by itself. If you didn't finish paying, you can complete your payment below.",
    },
    paid: { label: "Payment received", note: `We'll email ${order.email} again once it ships.` },
    shipped: { label: "On its way", note: `Shipped to you — we'll follow up with tracking at ${order.email}.` },
    delivered: { label: "Delivered", note: "Enjoy your new camera!" },
    cancelled: { label: "Order cancelled", note: "This order was cancelled. Contact us if that's unexpected." },
  };
  const status = statusCopy[order.status] ?? statusCopy.pending;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="mb-2 text-sm text-amberdeep">{status.label}</p>
      <h1 className="mb-1 font-display text-2xl font-semibold">Thanks, {order.full_name.split(" ")[0]}.</h1>
      <p className="mb-8 text-sm text-muted">
        Reference <span className="font-mono">{order.reference}</span> · {status.note}
      </p>

      {order.status === "pending" && (
        <div className="mb-8 border border-line bg-card p-5">
          <button
            onClick={payNow}
            disabled={paying}
            className="w-full justify-center bg-amber px-5 py-3 text-center font-display text-sm font-semibold text-navydeep transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {paying ? "Redirecting to PayFast…" : `Pay now with PayFast — ${formatZAR(order.total)}`}
          </button>
          {payError && <p className="mt-3 text-sm text-red-700">{payError}</p>}
        </div>
      )}

      <div className="border border-line bg-card p-6">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between border-b border-line py-3 text-sm last:border-b-0">
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatZAR(item.subtotal)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-display text-base font-semibold">
          <span>Total</span>
          <span>{formatZAR(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted">
        <p>Shipping to:</p>
        <p className="text-ink">
          {order.address_line1}
          {order.address_line2 && `, ${order.address_line2}`}, {order.city}, {order.province} {order.postal_code}
        </p>
      </div>

      <Link to="/" className="mt-8 inline-block bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
        Continue shopping
      </Link>
    </div>
  );
}