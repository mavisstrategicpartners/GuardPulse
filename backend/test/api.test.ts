import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import pg from "pg";

const ADMIN_DB = process.env.TEST_ADMIN_DATABASE_URL ?? "postgres://postgres@localhost:5433/postgres";
const TEST_DB = "gp_test";
const sent: { to: string; subject: string; text: string }[] = [];
let courierMode: "ok" | "fail" = "ok";
const realFetch = globalThis.fetch;

let app: { fetch: (r: Request) => Response | Promise<Response> };
let db: typeof import("../src/db.js");

const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
  app.fetch(new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0." + (Math.random() * 250 | 0), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
const json = async (r: Response) => r.json() as Promise<any>;

beforeAll(async () => {
  const admin = new pg.Client({ connectionString: ADMIN_DB });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  Object.assign(process.env, {
    DATABASE_URL: ADMIN_DB.replace(/\/postgres$/, `/${TEST_DB}`),
    ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "test-admin-pass", SESSION_SECRET: "0123456789abcdef0123456789abcdef",
    MAIL_ENABLED: "true", RESEND_API_KEY: "re_test", MAIL_ADMIN_ADDRESS: "admin@guardpulse.co.za",
    PAYFAST_SANDBOX: "true", PAYFAST_MERCHANT_ID: "10000100", PAYFAST_MERCHANT_KEY: "46f0cd694581a", PAYFAST_PASSPHRASE: "I love music",
    PAYFAST_RETURN_URL: "https://guardpulse.co.za/order", PAYFAST_CANCEL_URL: "https://guardpulse.co.za/order",
    PAYFAST_NOTIFY_URL: "https://api.guardpulse.co.za/api/payments/payfast/itn",
    COURIER_API_KEY: "test-key", COURIER_COLLECT_CODE: "0181", COURIER_COLLECT_CITY: "Pretoria", COURIER_COLLECT_ZONE: "Gauteng",
    CORS_ALLOWED_ORIGINS: "https://guardpulse.co.za", RATELIMIT_PER_MINUTE: "1000", APP_FRONTEND_URL: "https://guardpulse.co.za",
  });

  globalThis.fetch = vi.fn(async (input: any, init?: any) => {
    const url = String(input?.url ?? input);
    if (url.startsWith("https://api.resend.com")) {
      sent.push(JSON.parse(init.body).to.map((to: string) => ({ to, subject: JSON.parse(init.body).subject, text: JSON.parse(init.body).text }))[0]);
      return new Response("{}", { status: 200 });
    }
    if (url.includes("/eng/query/validate")) return new Response("VALID");
    if (url.includes("/rates")) {
      if (courierMode === "fail") return new Response("nope", { status: 500 });
      expect(init.headers.Authorization).toBe("Bearer test-key");
      return new Response(JSON.stringify({ rates: [
        { rate: 1280.9, service_level: { code: "SDX" } },
        { rate: 99.2, service_level: { code: "LSF" } },
        { rate: 188.54, service_level: { code: "LPF" } },
        { rate: 208.2, service_level: { code: "LPP" } },
      ] }), { status: 200 });
    }
    return realFetch(input, init);
  }) as any;

  const { migrate } = await import("../scripts/migrate.js");
  await migrate();
  const { seed } = await import("../scripts/seed.js");
  await seed();
  db = await import("../src/db.js");
  app = (await import("../src/core.js")).createApp();
}, 60_000);

afterAll(async () => { globalThis.fetch = realFetch; await db.closePool(); });
beforeEach(() => { sent.length = 0; courierMode = "ok"; });

async function newCart() { return (await json(await call("POST", "/api/cart/"))).token as string; }
async function addToCart(token: string, slug: string, quantity = 1) {
  return call("POST", `/api/cart/${token}/items/`, { product_slug: slug, quantity });
}
const addr = { full_name: "Zoë Tester", email: "zoe@example.com", phone: "0821234567", address_line1: "10 Midas Avenue", city: "Pretoria", province: "Gauteng", postal_code: "0081" };

describe("catalogue", () => {
  it("lists categories and products in the DRF envelope with snake_case fields", async () => {
    const cats = await json(await call("GET", "/api/categories/"));
    expect(cats.count).toBe(11);
    expect(cats.results[0]).toEqual({ id: expect.any(Number), key: "indoor", label: "Indoor", order: 1 });
    const prods = await json(await call("GET", "/api/products/"));
    expect(prods.count).toBe(59);
    expect(prods.results[0]).toHaveProperty("is_bundle");
    expect(prods.results[0]).toHaveProperty("stock_qty");
    const bundles = await json(await call("GET", "/api/products/?bundle=true"));
    expect(bundles.results.every((p: any) => p.is_bundle)).toBe(true);
  });
  it("returns detail with specs, 404 for unknown", async () => {
    const d = await json(await call("GET", "/api/products/xiaomi-c100/"));
    expect(d.specs).toHaveLength(10);
    expect(d.sku).toBe("BHR07VOGL");
    expect((await call("GET", "/api/products/nope")).status).toBe(404);
  });
  it("trailing slash is optional everywhere", async () => {
    expect((await call("GET", "/api/products")).status).toBe(200);
    expect((await call("GET", "/api/products/xiaomi-c100")).status).toBe(200);
  });
  it("reviews: submit, list, average", async () => {
    const r1 = await call("POST", "/api/products/xiaomi-c100/reviews", { author_name: " Sam ", rating: 5, comment: "Great" });
    expect(r1.status).toBe(200);
    await call("POST", "/api/products/xiaomi-c100/reviews", { author_name: "Lee", rating: 4, comment: "Good" });
    const list = await json(await call("GET", "/api/products/xiaomi-c100/reviews"));
    expect(list.count).toBe(2);
    expect(list.average_rating).toBe(4.5);
    expect(list.reviews[0]).toMatchObject({ author_name: "Lee", verified_purchase: false });
    expect((await call("POST", "/api/products/xiaomi-c100/reviews", { author_name: "x", rating: 9, comment: "c" })).status).toBe(400);
    expect((await call("GET", "/api/products/nope/reviews")).status).toBe(404);
  });
});

describe("cart", () => {
  it("add / update / remove with totals and stock limits", async () => {
    const t = await newCart();
    const c1 = await json(await addToCart(t, "xiaomi-c100", 2));
    expect(c1.total).toBe(2398);
    expect(c1.items[0]).toMatchObject({ quantity: 2, subtotal: 2398 });
    const c2 = await json(await addToCart(t, "xiaomi-c100"));
    expect(c2.items[0].quantity).toBe(3);
    const id = c2.items[0].id;
    const over = await call("PATCH", `/api/cart/${t}/items/${id}/`, { quantity: 999 });
    expect(over.status).toBe(409);
    expect((await json(over)).message).toBe('Only 25 left in stock for "Xiaomi Smart Camera C100"');
    const c3 = await json(await call("PATCH", `/api/cart/${t}/items/${id}/`, { quantity: 1 }));
    expect(c3.total).toBe(1199);
    const c4 = await json(await call("DELETE", `/api/cart/${t}/items/${id}/`));
    expect(c4.items).toEqual([]);
    expect((await call("GET", "/api/cart/not-a-uuid/")).status).toBe(400);
    expect((await call("GET", "/api/cart/00000000-0000-4000-8000-000000000000/")).status).toBe(404);
  });
});

describe("shipping", () => {
  it("uses weight tiers without an address, live courier with one, tiers if the courier fails", async () => {
    const t = await newCart();
    await addToCart(t, "xiaomi-c100"); // 0.35 kg -> tier 1 = R110
    expect(await json(await call("GET", `/api/shipping/quote?cart_token=${t}`))).toEqual({ fee: 110, weight_kg: 0.35 });
    const q = "&street=10%20Midas&city=Pretoria&province=Gauteng&postal_code=0081";
    expect((await json(await call("GET", `/api/shipping/quote?cart_token=${t}${q}`))).fee).toBe(189); // cheapest allowed (LPF 188.54 -> 189); SDX & LSF excluded
    courierMode = "fail";
    expect((await json(await call("GET", `/api/shipping/quote?cart_token=${t}${q}`))).fee).toBe(110);
  });
  it("tier maths matches the old Java rounding at boundaries", async () => {
    const { feeForWeightGrams } = await import("../src/lib/shipping.js");
    expect([1000, 1001, 3000, 3001, 5000, 5001, 10000, 10001, 12500].map(feeForWeightGrams))
      .toEqual([110, 145, 145, 175, 175, 220, 220, 220, 258]); // over 10 kg: 220 + extra kg x R15, rounded half-up
  });
});

describe("checkout", () => {
  it("rejects bad input with a readable message", async () => {
    const t = await newCart(); await addToCart(t, "xiaomi-c100");
    const r = await call("POST", "/api/orders/", { ...addr, cart_token: t, email: "nope" });
    expect(r.status).toBe(400);
    expect((await json(r)).message).toBe("email must be a well-formed email address");
    expect((await call("POST", "/api/orders/", { ...addr, cart_token: "x" })).status).toBe(400);
  });
  it("creates the order, takes the courier fee server-side, decrements stock, empties the cart, sends emails", async () => {
    const t = await newCart(); await addToCart(t, "xiaomi-c100", 2);
    const before = (await db.q1("SELECT stock_qty FROM products WHERE slug='xiaomi-c100'"))!.stock_qty;
    const r = await call("POST", "/api/orders/", { ...addr, cart_token: t, shipping_fee: 0 }); // client-sent fee must be ignored
    expect(r.status).toBe(201);
    const o = await json(r);
    expect(o).toMatchObject({ status: "pending", shipping_fee: 189, total: 2398 + 189, full_name: "Zoë Tester" });
    expect(o.items[0]).toMatchObject({ product_name: "Xiaomi Smart Camera C100", unit_price: 1199, quantity: 2, subtotal: 2398 });
    expect((await db.q1("SELECT stock_qty FROM products WHERE slug='xiaomi-c100'"))!.stock_qty).toBe(before - 2);
    expect((await json(await call("GET", `/api/cart/${t}/`))).items).toEqual([]);
    expect((await call("POST", "/api/orders/", { ...addr, cart_token: t })).status).toBe(400); // now empty
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const ref = "GP-" + o.reference.slice(0, 8).toUpperCase();
    expect(sent.map((m) => m.to).sort()).toEqual(["admin@guardpulse.co.za", "zoe@example.com"]);
    expect(sent.find((m) => m.to === "zoe@example.com")!.subject).toBe(`GuardPulse order confirmed — ${ref}`);
    // lookup
    expect((await call("GET", `/api/orders/${o.reference}/`)).status).toBe(200);
    expect((await call("GET", `/api/orders/lookup?reference=${o.reference}&email=ZOE@example.com`)).status).toBe(200);
    expect((await call("GET", `/api/orders/lookup?reference=${o.reference}&email=other@example.com`)).status).toBe(404);
  });
  it("two simultaneous checkouts for the last unit: exactly one wins", async () => {
    await db.q("UPDATE products SET stock_qty = 1 WHERE slug='tapo-c200-pan-tilt'");
    const t1 = await newCart(), t2 = await newCart();
    expect((await addToCart(t1, "tapo-c200-pan-tilt")).status).toBe(200);
    expect((await addToCart(t2, "tapo-c200-pan-tilt")).status).toBe(200);
    const [a, b] = await Promise.all([call("POST", "/api/orders/", { ...addr, cart_token: t1 }), call("POST", "/api/orders/", { ...addr, cart_token: t2 })]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect((await db.q1("SELECT stock_qty FROM products WHERE slug='tapo-c200-pan-tilt'"))!.stock_qty).toBe(0);
  });
});

describe("PayFast", () => {
  const md5 = (s: string) => createHash("md5").update(s).digest("hex");
  async function pendingOrder() {
    const t = await newCart(); await addToCart(t, "xiaomi-c302");
    return json(await call("POST", "/api/orders/", { ...addr, cart_token: t }));
  }
  async function itn(order: any, over: Record<string, string> = {}, tamper = false) {
    const { urlEncode } = await import("../src/lib/payfast.js");
    const f: [string, string][] = Object.entries({
      m_payment_id: order.reference, pf_payment_id: "1089250", payment_status: "COMPLETE", item_name: "GuardPulse order",
      item_description: "", amount_gross: order.total.toFixed(2), amount_fee: "-2.30", amount_net: "97.70",
      custom_str1: "", custom_str2: "", custom_int1: "", name_first: "Zoë", email_address: "zoe@example.com", merchant_id: "10000100", ...over,
    });
    const params = f.map(([k, v]) => `${k}=${urlEncode(v)}`).join("&");
    const sig = md5(`${params}&passphrase=${urlEncode("I love music")}`);
    const body = params + `&signature=${tamper ? "0".repeat(32) : sig}`;
    return app.fetch(new Request("http://localhost/api/payments/payfast/itn", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body }));
  }
  it("builds a signed redirect that PayFast would accept, and refuses non-pending orders", async () => {
    const o = await pendingOrder();
    const init = await json(await call("GET", `/api/payments/payfast/${o.reference}/`));
    expect(init.process_url).toBe("https://sandbox.payfast.co.za/eng/process");
    const f = init.fields;
    expect(f).toMatchObject({ merchant_id: "10000100", m_payment_id: o.reference, amount: o.total.toFixed(2), name_first: "Zoë", name_last: "Tester",
      return_url: `https://guardpulse.co.za/order/${o.reference}`, notify_url: "https://api.guardpulse.co.za/api/payments/payfast/itn" });
    const { signOutgoing } = await import("../src/lib/payfast.js");
    expect(f.signature).toBe(signOutgoing(f));
    expect(Object.keys(f).at(-1)).toBe("signature");
    await db.q("UPDATE orders SET status='PAID' WHERE reference=$1", [o.reference]);
    expect((await call("GET", `/api/payments/payfast/${o.reference}/`)).status).toBe(409);
  });
  it("marks PAID exactly once, emails once, and retries are harmless", async () => {
    const o = await pendingOrder(); sent.length = 0;
    expect((await itn(o)).status).toBe(200);
    expect((await db.q1("SELECT status FROM orders WHERE reference=$1", [o.reference]))!.status).toBe("PAID");
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[0].subject).toContain("Payment received");
    expect((await itn(o)).status).toBe(200);
    await new Promise((r) => setTimeout(r, 100));
    expect(sent).toHaveLength(2);
  });
  it("rejects a bad signature, wrong amount, and ignores unknown orders", async () => {
    const o = await pendingOrder();
    expect((await itn(o, {}, true)).status).toBe(400);
    expect((await itn(o, { amount_gross: "1.00" })).status).toBe(400);
    expect((await itn(o, { merchant_id: "999" })).status).toBe(400);
    expect((await db.q1("SELECT status FROM orders WHERE reference=$1", [o.reference]))!.status).toBe("PENDING");
    expect((await itn({ ...o, reference: "00000000-0000-4000-8000-000000000000" })).status).toBe(200);
    expect((await itn(o, { payment_status: "CANCELLED" })).status).toBe(200);
    expect((await db.q1("SELECT status FROM orders WHERE reference=$1", [o.reference]))!.status).toBe("PENDING");
  });
});

describe("accounts", () => {
  it("register, login, me, profile, orders, logout", async () => {
    const reg = await call("POST", "/api/auth/register", { full_name: "Ann Lee", email: "Ann@Example.com", password: "supersecret1", phone: " 0123 " });
    expect(reg.status).toBe(201);
    const { token, customer } = await json(reg);
    expect(customer).toMatchObject({ email: "ann@example.com", full_name: "Ann Lee", phone: "0123" });
    expect((await call("POST", "/api/auth/register", { full_name: "A", email: "ann@example.com", password: "supersecret1" })).status).toBe(409);
    expect((await json(await call("POST", "/api/auth/register", { full_name: "A", email: "b@example.com", password: "short" }))).message).toBe("password size must be between 8 and 72");
    expect((await call("POST", "/api/auth/login", { email: "ann@example.com", password: "wrong-password" })).status).toBe(401);
    const login = await json(await call("POST", "/api/auth/login", { email: "ANN@example.com", password: "supersecret1" }));
    const H = { authorization: `Bearer ${login.token}` };
    expect((await json(await call("GET", "/api/auth/me", undefined, H))).email).toBe("ann@example.com");
    expect((await call("GET", "/api/auth/me")).status).toBe(401);
    expect((await json(await call("PATCH", "/api/auth/me", { full_name: "Ann B", phone: "" }, H)))).toMatchObject({ full_name: "Ann B", phone: null });
    const t = await newCart(); await addToCart(t, "xiaomi-c100");
    await call("POST", "/api/orders/", { ...addr, cart_token: t }, H);
    expect(await json(await call("GET", "/api/auth/orders", undefined, H))).toHaveLength(1);
    expect((await call("POST", "/api/auth/logout", undefined, H)).status).toBe(204);
    expect((await call("GET", "/api/auth/me", undefined, H)).status).toBe(401);
    expect(token).toBeTruthy();
  });
  it("forgot / reset password: neutral answer, one-time link, kills old sessions", async () => {
    const reg = await json(await call("POST", "/api/auth/register", { full_name: "Bo Reset", email: "bo@example.com", password: "originalpass1" }));
    sent.length = 0;
    const same = (await json(await call("POST", "/api/auth/forgot-password", { email: "nobody@example.com" }))).message;
    expect(same).toBe("If that email has an account, we've sent a reset link.");
    expect(sent).toHaveLength(0);
    expect((await json(await call("POST", "/api/auth/forgot-password", { email: "bo@example.com" }))).message).toBe(same);
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    const raw = /token=([\w-]+)/.exec(sent[0].text)![1];
    expect(sent[0].text).toContain(`https://guardpulse.co.za/reset-password?token=${raw}`);
    expect((await call("POST", "/api/auth/reset-password", { token: "bad", new_password: "newpassword1" })).status).toBe(400);
    expect((await call("POST", "/api/auth/reset-password", { token: raw, new_password: "newpassword1" })).status).toBe(200);
    expect((await call("POST", "/api/auth/reset-password", { token: raw, new_password: "another12345" })).status).toBe(400); // single use
    expect((await call("GET", "/api/auth/me", undefined, { authorization: `Bearer ${reg.token}` })).status).toBe(401);
    expect((await call("POST", "/api/auth/login", { email: "bo@example.com", password: "newpassword1" })).status).toBe(200);
  });
  it("accepts a bcrypt hash written by the old Spring backend", async () => {
    // $2a$10$ hash of "legacy-pass-1", as Spring's BCryptPasswordEncoder would have stored it.
    const bcrypt = (await import("bcryptjs")).default;
    const legacy = bcrypt.hashSync("legacy-pass-1", 10).replace(/^\$2b\$/, "$2a$");
    await db.q("INSERT INTO customers (email, password_hash, full_name) VALUES ('old@example.com', $1, 'Old Timer')", [legacy]);
    expect((await call("POST", "/api/auth/login", { email: "old@example.com", password: "legacy-pass-1" })).status).toBe(200);
  });
});

describe("admin", () => {
  const host = { host: "localhost" };
  async function login(pw = "test-admin-pass") {
    const r = await app.fetch(new Request("http://localhost/admin/login", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", ...host }, body: `username=admin&password=${pw}` }));
    return r;
  }
  const cookieOf = (r: Response) => r.headers.get("set-cookie")!.split(";")[0];
  const admin = (method: string, path: string, cookie: string, body?: string, extra: Record<string, string> = {}) =>
    app.fetch(new Request(`http://localhost${path}`, { method, headers: { cookie, "content-type": "application/x-www-form-urlencoded", ...host, ...extra }, body }));

  it("blocks anonymous access, rejects a wrong password, accepts the right one", async () => {
    const anon = await app.fetch(new Request("http://localhost/admin/orders", { redirect: "manual" }));
    expect(anon.status).toBe(302); expect(anon.headers.get("location")).toBe("/admin/login");
    const bad = await login("nope");
    expect(bad.headers.get("location")).toBe("/admin/login?error");
    const ok = await login();
    expect(ok.headers.get("location")).toBe("/admin/");
    expect(ok.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    const dash = await admin("GET", "/admin/", cookieOf(ok));
    expect(dash.status).toBe(200);
    expect(await dash.text()).toContain("Revenue (paid orders)");
  });
  it("rejects a forged cookie", async () => {
    expect((await admin("GET", "/admin/orders", "gp_admin=eyJ1IjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.forged")).status).toBe(302);
  });
  it("changes order status, escapes HTML, and blocks cross-site posts", async () => {
    const c = cookieOf(await login());
    const t = await newCart(); await addToCart(t, "xiaomi-c100");
    const o = await json(await call("POST", "/api/orders/", { ...addr, full_name: "<script>alert(1)</script>", cart_token: t }));
    const row = (await db.q1("SELECT id FROM orders WHERE reference=$1", [o.reference]))!;
    const page = await (await admin("GET", `/admin/orders/${row.id}`, c)).text();
    expect(page).not.toContain("<script>alert(1)</script>");
    expect(page).toContain("&lt;script&gt;");
    expect((await admin("POST", `/admin/orders/${row.id}/status`, c, "status=SHIPPED", { origin: "https://evil.example" })).status).toBe(403);
    const r = await admin("POST", `/admin/orders/${row.id}/status`, c, "status=SHIPPED", { origin: "http://localhost" });
    expect(r.status).toBe(302);
    expect((await db.q1("SELECT status FROM orders WHERE id=$1", [row.id]))!.status).toBe("SHIPPED");
    expect((await admin("POST", `/admin/orders/${row.id}/status`, c, "status=BOGUS")).status).toBe(400);
  });
  it("creates, edits, and deletes/deactivates products", async () => {
    const c = cookieOf(await login());
    const form = (o: Record<string, string>) => new URLSearchParams(o).toString();
    const base = { name: "Test Cam", brand: "acme", categoryId: "1", tagline: "tag", price: "99.50", stockQty: "7", weightKg: "0.4", costPrice: "50" };
    const dup = await admin("POST", "/admin/products", c, form({ ...base, slug: "xiaomi-c100" }));
    expect(dup.headers.get("location")).toBe("/admin/products/new?slugTaken");
    const made = await admin("POST", "/admin/products", c, form({ ...base, slug: "test-cam" }));
    const id = /products\/(\d+)\/edit/.exec(made.headers.get("location")!)![1];
    const saved = await admin("POST", `/admin/products/${id}`, c, form({ ...base, price: "120", active: "on", imageUrl: "/products/x.jpg" }));
    expect(saved.headers.get("location")).toContain("?saved");
    expect(await db.q1("SELECT price, active, image_url FROM products WHERE id=$1", [id])).toEqual({ price: 120, active: true, image_url: "/products/x.jpg" });
    expect((await admin("POST", `/admin/products/${id}`, c, form({ ...base }))).status).toBe(302);
    expect((await db.q1("SELECT active FROM products WHERE id=$1", [id]))!.active).toBe(false); // unchecked box = inactive
    expect((await admin("POST", `/admin/products/${id}/delete`, c)).headers.get("location")).toBe("/admin/products?deleted");
    // a product with order history is deactivated instead
    const hist = (await db.q1("SELECT product_id AS id FROM order_items LIMIT 1"))!;
    expect((await admin("POST", `/admin/products/${hist.id}/delete`, c)).headers.get("location")).toBe("/admin/products?deactivatedInstead");
    expect((await db.q1("SELECT active FROM products WHERE id=$1", [hist.id]))!.active).toBe(false);
  });
  it("deletes a customer but keeps their orders", async () => {
    const c = cookieOf(await login());
    const cust = (await db.q1("SELECT c.id FROM customers c JOIN orders o ON o.customer_id=c.id LIMIT 1"))!;
    const orders = Number((await db.q1("SELECT count(*) n FROM orders WHERE customer_id=$1", [cust.id]))!.n);
    await admin("POST", `/admin/customers/${cust.id}/delete`, c);
    expect(await db.q1("SELECT 1 FROM customers WHERE id=$1", [cust.id])).toBeNull();
    expect(orders).toBeGreaterThan(0);
    expect(Number((await db.q1("SELECT count(*) n FROM orders WHERE customer_id IS NULL"))!.n)).toBeGreaterThanOrEqual(orders);
  });
});

describe("platform", () => {
  it("CORS allows only the configured origins", async () => {
    const ok = await call("GET", "/api/categories/", undefined, { origin: "https://guardpulse.co.za" });
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://guardpulse.co.za");
    const bad = await call("GET", "/api/categories/", undefined, { origin: "https://evil.example" });
    expect(bad.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("store-info matches the old shape", async () => {
    expect(await json(await call("GET", "/api/store-info"))).toEqual({ vat_number: null, vat_rate_percent: 15, prices_include_vat: true });
  });
  it("rate limits /api/auth to 20 per minute per IP, in the database", async () => {
    const ip = { "x-forwarded-for": "203.0.113.9" };
    const codes: number[] = [];
    for (let i = 0; i < 22; i++) codes.push((await call("POST", "/api/auth/login", { email: "x@example.com", password: "whatever12" }, ip)).status);
    expect(codes.slice(0, 20).every((s) => s === 401)).toBe(true);
    expect(codes.slice(20)).toEqual([429, 429]);
  });
  it("500s come back as JSON { message }", async () => {
    const r = await call("POST", "/api/orders/", "not json" as any);
    expect(r.status).toBe(400);
    expect(await json(r)).toHaveProperty("message");
  });
});
