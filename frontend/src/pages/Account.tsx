import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import { errorMessage, fetchMyOrders } from "../api/client";
import type { Order } from "../types";
import { formatZAR } from "../components/ProductCard";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function Account() {
  const { customer, loading, logout, updateProfile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const customerId = customer?.id;
  useEffect(() => {
    if (customerId === undefined) return;
    let cancelled = false;
    fetchMyOrders()
      .then((o) => {
        if (!cancelled) setOrders(o);
      })
      .catch(() => {
        if (!cancelled) setOrdersError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (loading) return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;
  if (!customer) return <Navigate to="/login" state={{ from: "/account" }} replace />;

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setProfileError(null);
    const form = new FormData(e.currentTarget);
    try {
      await updateProfile({
        full_name: String(form.get("full_name")).trim(),
        phone: String(form.get("phone") ?? "").trim(),
      });
      setSaved(true);
    } catch (err) {
      setProfileError(errorMessage(err, "We couldn't save your changes."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">My account</h1>
          <p className="mt-1 text-sm text-muted">{customer.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="border border-line px-4 py-2 font-display text-sm text-ink transition-colors hover:bg-card"
        >
          Log out
        </button>
      </div>

      <section className="mb-10 border border-line bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Your details</h2>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[13px] text-[#5C5545]">Full name</label>
            <input
              name="full_name"
              required
              defaultValue={customer.full_name}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-[#5C5545]">Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={customer.phone ?? ""}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-navydeep px-5 py-2.5 font-display text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="ml-3 text-sm text-teal">Saved.</span>}
            {profileError && <span className="ml-3 text-sm text-red-700">{profileError}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Your orders</h2>
        {ordersError && <p className="text-sm text-red-700">We couldn't load your orders right now. Please refresh.</p>}
        {!ordersError && orders === null && <p className="text-sm text-muted">Loading your orders…</p>}
        {orders && orders.length === 0 && (
          <p className="text-sm text-muted">
            You haven't placed any orders with this account yet.{" "}
            <Link to="/" className="text-amberdeep hover:underline">
              Browse cameras
            </Link>
          </p>
        )}
        {orders && orders.length > 0 && (
          <div className="grid gap-3">
            {orders.map((o) => (
              <Link
                key={o.reference}
                to={`/order/${o.reference}`}
                className="block border border-line bg-card p-5 transition-colors hover:border-amberdeep"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{o.reference.slice(0, 8)}…</span>
                  <span className="text-xs text-amberdeep">{STATUS_LABEL[o.status] ?? o.status}</span>
                </div>
                <p className="mt-2 text-[13.5px]">
                  {o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}
                </p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">{new Date(o.created_at).toLocaleDateString("en-ZA")}</span>
                  <span className="font-display font-semibold">{formatZAR(o.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}