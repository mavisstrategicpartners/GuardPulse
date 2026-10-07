import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../api/AuthContext";
import { fetchMyOrders, updateCustomerProfile } from "../../api/client";
import type { Order } from "../../types";
import { formatZAR } from "../../components/ProductCard";

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment processing",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function extractErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || "Something went wrong — please try again.";
}

export default function Account() {
  const { customer, loading, logout, setCustomer } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    fetchMyOrders()
      .then(setOrders)
      .catch((err) => setOrdersError(extractErrorMessage(err)));
  }, [customer]);

  if (loading) {
    return <p className="px-6 py-20 text-center text-sm text-muted">Loading…</p>;
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: "/account" }} />;
  }

  async function handleSaveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setProfileError(null);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await updateCustomerProfile({
        full_name: String(form.get("full_name")),
        phone: String(form.get("phone") ?? ""),
      });
      setCustomer(updated);
      setEditing(false);
    } catch (err) {
      setProfileError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">My account</h1>
        <button onClick={handleLogout} className="text-sm text-amberdeep hover:underline">
          Log out
        </button>
      </div>

      <section className="mb-12 border border-line bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-amberdeep hover:underline">
              Edit
            </button>
          )}
        </div>

        {profileError && (
          <div className="mb-4 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {profileError}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSaveProfile} className="grid gap-4">
            <div>
              <label className="mb-1 block text-[13px] text-[#5C5545]">Full name</label>
              <input
                name="full_name"
                type="text"
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
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-navydeep px-5 py-2.5 font-display text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 text-sm text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd>{customer.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd>{customer.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phone</dt>
              <dd>{customer.phone || "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Order history</h2>

        {ordersError && (
          <div className="mb-4 border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-700">{ordersError}</div>
        )}

        {orders === null && !ordersError && <p className="text-sm text-muted">Loading your orders…</p>}

        {orders?.length === 0 && (
          <div className="border border-line bg-card p-6 text-center">
            <p className="mb-4 text-sm text-muted">You haven't placed any orders yet.</p>
            <Link to="/" className="inline-block bg-navydeep px-5 py-2.5 font-display text-sm text-paper">
              Browse cameras
            </Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Link
                key={order.reference}
                to={`/order/${order.reference}`}
                className="block border border-line bg-card p-5 transition-colors hover:border-amberdeep"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-muted">{order.reference}</span>
                  <span className="text-amberdeep">{STATUS_LABEL[order.status] ?? order.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.items.length} item{order.items.length === 1 ? "" : "s"}
                  </span>
                  <span className="font-display text-sm font-semibold">{formatZAR(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}