export const esc = (v: unknown): string =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const STYLES = `
:root{--ink:#171B22;--navydeep:#10151C;--paper:#ECE9E1;--card:#F6F4EF;--amber:#E29A3C;--amberdeep:#B9791F;--teal:#3E6B63;--line:#D9D4C6;--muted:#71695A;--danger:#B3261E}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,Inter,Segoe UI,sans-serif}
a{color:var(--amberdeep)}
.topbar{background:var(--navydeep);color:var(--paper);padding:16px 28px;display:flex;align-items:center;justify-content:space-between}
.topbar .brand{font-weight:700;font-size:18px;letter-spacing:-.02em}
.topbar nav a{color:#C7C2B6;text-decoration:none;margin-right:20px;font-size:14px}
.topbar nav a.active{color:var(--amber)}
.topbar form{display:inline}
.topbar button{background:none;border:1px solid rgba(236,233,225,.35);color:var(--paper);padding:6px 12px;font-size:13px;cursor:pointer}
.wrap{max-width:1100px;margin:0 auto;padding:32px 24px}
h1{font-size:24px;margin:0 0 22px}
table{width:100%;border-collapse:collapse;background:var(--card)}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--line);font-size:13.5px}
th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.03em}
tr:hover td{background:rgba(226,154,60,.06)}
.card{background:var(--card);border:1px solid var(--line);padding:22px;margin-bottom:20px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:28px}
.stat{background:var(--card);border:1px solid var(--line);padding:18px}
.stat .label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
.stat .value{font-size:26px;font-weight:700;margin-top:6px}
.badge{display:inline-block;padding:2px 9px;font-size:11.5px;border-radius:2px}
.badge-pending{background:#EFE0C4;color:#7A5A14}.badge-paid{background:#D7E6D9;color:#2C5B34}
.badge-shipped{background:#D6E3EE;color:#1E4C72}.badge-delivered{background:#DDE8DE;color:#25502B}
.badge-cancelled,.badge-low{background:#F1D6D3;color:var(--danger)}
label{display:block;font-size:13px;color:#5C5545;margin-bottom:4px}
input[type=text],input[type=password],input[type=number],input[type=file],select{width:100%;padding:9px 11px;border:1px solid var(--line);background:#fff;font-size:14px;margin-bottom:16px}
button,.btn{background:var(--navydeep);color:var(--paper);border:none;padding:10px 18px;font-size:14px;cursor:pointer;text-decoration:none;display:inline-block}
button.primary,.btn.primary{background:var(--amber);color:var(--navydeep);font-weight:600}
.login-box{max-width:340px;margin:80px auto;background:var(--card);border:1px solid var(--line);padding:32px}
.error-msg{background:#F1D6D3;color:var(--danger);padding:10px 14px;margin-bottom:16px;font-size:13.5px}
button.danger{background:var(--danger);color:#fff;padding:6px 12px;font-size:13px}
.notice{background:#D7E6D9;color:#2C5B34;padding:10px 14px;margin-bottom:16px;font-size:13.5px}
.muted{color:var(--muted);font-size:13px}
.checkbox-row{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.checkbox-row input{width:auto;margin:0}`;

export function page(title: string, body: string, active?: string): string {
  const nav = active === undefined ? "" : `
  <div class="topbar"><div class="brand">GuardPulse admin</div>
    <div style="display:flex;align-items:center;"><nav>
      ${[["dashboard", "/admin/", "Dashboard"], ["orders", "/admin/orders", "Orders"], ["products", "/admin/products", "Products"], ["customers", "/admin/customers", "Customers"]]
        .map(([k, href, label]) => `<a href="${href}"${active === k ? ' class="active"' : ""}>${label}</a>`).join("")}
    </nav><form method="post" action="/admin/logout"><button type="submit">Log out</button></form></div></div>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — GuardPulse admin</title><meta name="robots" content="noindex"><style>${STYLES}</style></head><body>${nav}${body}</body></html>`;
}

const rand = (n: unknown) => "R" + Number(n).toFixed(2);
export const badge = (status: string) => `<span class="badge badge-${esc(status.toLowerCase())}">${esc(status)}</span>`;

const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
export function fmtDate(d: Date | string): string {
  const parts = Object.fromEntries(dateFmt.formatToParts(new Date(d)).map((p) => [p.type, p.value]));
  return `${parts.day} ${parts.month} ${parts.year} ${parts.hour}:${parts.minute}`;
}

export const loginPage = (opts: { error?: boolean; loggedOut?: boolean; disabled?: boolean }) => page("Log in", `
<div class="login-box"><h1 style="font-size:20px;">GuardPulse admin</h1>
${opts.disabled ? '<p class="error-msg">Admin is not configured: set ADMIN_PASSWORD and SESSION_SECRET.</p>' : ""}
${opts.error ? '<p class="error-msg">Incorrect username or password.</p>' : ""}
${opts.loggedOut ? '<p class="muted" style="margin-bottom:16px;">You\'ve been logged out.</p>' : ""}
<form method="post" action="/admin/login">
<label for="username">Username</label><input type="text" id="username" name="username" autocomplete="username" required>
<label for="password">Password</label><input type="password" id="password" name="password" autocomplete="current-password" required>
<button type="submit" class="primary" style="width:100%;">Log in</button></form></div>`);

export const dashboardPage = (d: { orderCount: number; revenue: number; customerCount: number; lowStock: any[]; recent: any[] }) => page("Dashboard", `
<div class="wrap"><h1>Dashboard</h1><div class="stat-grid">
<div class="stat"><div class="label">Orders</div><div class="value">${d.orderCount}</div></div>
<div class="stat"><div class="label">Revenue (paid orders)</div><div class="value">R${Math.round(d.revenue).toLocaleString("en-US")}</div></div>
<div class="stat"><div class="label">Registered customers</div><div class="value">${d.customerCount}</div></div>
<div class="stat"><div class="label">Products low on stock (&lt;5)</div><div class="value">${d.lowStock.length}</div></div></div>
${d.lowStock.length ? `<div class="card"><strong>Low stock</strong><table style="margin-top:12px;"><tr><th>Product</th><th>Stock left</th><th></th></tr>
${d.lowStock.map((p) => `<tr><td>${esc(p.name)}</td><td><span class="badge badge-low">${p.stock_qty}</span></td><td><a href="/admin/products/${p.id}/edit">Restock →</a></td></tr>`).join("")}</table></div>` : ""}
<div class="card"><strong>Recent orders</strong><table style="margin-top:12px;"><tr><th>Reference</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr>
${d.recent.map((o) => `<tr><td>${esc(o.reference.slice(0, 8))}…</td><td>${esc(o.full_name)}</td><td>${badge(o.status)}</td><td>${rand(o.total)}</td><td><a href="/admin/orders/${o.id}">View →</a></td></tr>`).join("")}</table></div></div>`, "dashboard");

export const ordersPage = (orders: any[]) => page("Orders", `
<div class="wrap"><h1>Orders</h1><table><tr><th>Reference</th><th>Date</th><th>Customer</th><th>Status</th><th>Total</th><th></th></tr>
${orders.map((o) => `<tr><td>${esc(o.reference.slice(0, 8))}…</td><td>${fmtDate(o.created_at)}</td><td>${esc(o.full_name)} — ${esc(o.email)}</td><td>${badge(o.status)}</td><td>${rand(o.total)}</td><td><a href="/admin/orders/${o.id}">View →</a></td></tr>`).join("")}
${orders.length ? "" : '<tr><td colspan="6" class="muted">No orders yet.</td></tr>'}</table></div>`, "orders");

export const orderDetailPage = (o: any, items: any[], statuses: string[]) => page("Order", `
<div class="wrap"><p class="muted"><a href="/admin/orders">← All orders</a></p><h1>Order ${esc(o.reference)}</h1>
<div class="card"><strong>Status</strong>
<form method="post" action="/admin/orders/${o.id}/status" style="margin-top:12px;display:flex;gap:10px;align-items:flex-end;">
<div style="flex-grow:1;"><label for="status">Update status</label>
<select id="status" name="status" style="margin-bottom:0;">${statuses.map((s) => `<option value="${s}"${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select></div>
<button type="submit" class="primary">Save</button></form></div>
<div class="card"><strong>Customer</strong><p style="margin:10px 0 0;">${esc(o.full_name)}</p><p class="muted">${esc(o.email)} · ${esc(o.phone)}</p></div>
<div class="card"><strong>Shipping address</strong><p style="margin:10px 0 0;">${esc(o.address_line1)}${o.address_line2 ? ", " + esc(o.address_line2) : ""}<br>${esc(o.city)}, ${esc(o.province)} ${esc(o.postal_code)}</p></div>
<div class="card"><strong>Items</strong><table style="margin-top:12px;"><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr>
${items.map((i) => `<tr><td>${esc(i.product_name)}</td><td>${i.quantity}</td><td>${rand(i.unit_price)}</td><td>${rand(Math.round(i.unit_price * 100) * i.quantity / 100)}</td></tr>`).join("")}</table>
<p style="text-align:right;margin-top:14px;"><span class="muted">Shipping: ${rand(o.shipping_fee)}</span><br><strong style="font-size:18px;">Total: ${rand(o.total)}</strong></p></div></div>`, "orders");

export const customersPage = (rows: any[], deleted: boolean) => page("Customers", `
<div class="wrap"><h1>Customers</h1>${deleted ? '<p class="notice">Account deleted. Their past orders were kept.</p>' : ""}
<p class="muted" style="margin-bottom:14px;">Shoppers who registered an account. Deleting an account logs the person out straight away and removes their login; their past orders stay in <a href="/admin/orders">Orders</a>.</p>
<table><tr><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Orders</th><th></th></tr>
${rows.map((r) => `<tr><td>${esc(r.full_name)}</td><td>${esc(r.email)}</td><td>${esc(r.phone ?? "—")}</td><td>${fmtDate(r.created_at)}</td><td>${r.order_count}</td><td>
<form method="post" action="/admin/customers/${r.id}/delete" onsubmit="return confirm('Delete this customer account? They will be logged out immediately. Their past orders are kept. This cannot be undone.');"><button type="submit" class="danger">Delete</button></form></td></tr>`).join("")}
${rows.length ? "" : '<tr><td colspan="6" class="muted">No customers have registered yet.</td></tr>'}</table></div>`, "customers");

export const categoriesPage = (cats: any[], flags: { created: boolean; keyTaken: boolean }) => page("Categories", `
<div class="wrap" style="max-width:560px;"><p class="muted"><a href="/admin/products">← All products</a></p><h1>Categories</h1>
${flags.created ? '<p class="notice">Category added.</p>' : ""}${flags.keyTaken ? '<p class="error-msg">That key is already in use — pick a different one.</p>' : ""}
<table style="margin-bottom:24px;"><tr><th>Label</th><th>Key</th><th>Sort order</th></tr>
${cats.map((c) => `<tr><td>${esc(c.label)}</td><td>${esc(c.key)}</td><td>${c.sort_order}</td></tr>`).join("")}</table>
<div class="card"><strong>Add a category</strong><form method="post" action="/admin/categories" style="margin-top:14px;">
<label for="label">Label (shown to customers)</label><input type="text" id="label" name="label" required placeholder="e.g. Smart Locks">
<label for="key">Key (used internally, no spaces)</label><input type="text" id="key" name="key" required placeholder="e.g. smart-locks">
<label for="sortOrder">Sort order</label><input type="number" id="sortOrder" name="sortOrder" value="0">
<button type="submit" class="primary">Add category</button></form></div></div>`, "products");

export const productsPage = (products: any[], flags: { deleted: boolean; deactivatedInstead: boolean }) => page("Products", `
<div class="wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;"><h1 style="margin:0;">Products</h1>
<div><a href="/admin/categories" class="btn" style="margin-right:8px;">Manage categories</a><a href="/admin/products/new" class="btn primary">+ New product</a></div></div>
${flags.deleted ? '<p class="notice">Product deleted.</p>' : ""}
${flags.deactivatedInstead ? '<p class="notice">That product has order history, so it was deactivated instead of deleted — it\'s hidden from the store but past orders still reference it.</p>' : ""}
<table><tr><th></th><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Active</th><th></th></tr>
${products.map((p) => `<tr><td style="width:48px;">${p.image_url ? `<img src="${esc(p.image_url)}" alt="" style="width:40px;height:40px;object-fit:contain;background:var(--paper);">` : ""}</td>
<td>${esc(p.name)}</td><td>${esc(p.brand)}</td><td>${esc(p.category_label)}</td><td>${rand(p.price)}</td>
<td>${p.stock_qty < 5 ? `<span class="badge badge-low">${p.stock_qty}</span>` : p.stock_qty}</td><td>${p.active ? "Yes" : "No"}</td>
<td><a href="/admin/products/${p.id}/edit">Edit →</a></td></tr>`).join("")}</table></div>`, "products");

export const productEditPage = (p: any | null, cats: any[], flags: { created: boolean; saved: boolean; slugTaken: boolean; error?: string; canUpload: boolean }) => {
  const v = (x: unknown) => esc(x ?? "");
  return page(p ? "Edit product" : "New product", `
<div class="wrap" style="max-width:560px;"><p class="muted"><a href="/admin/products">← All products</a></p><h1>${p ? esc(p.name) : "New product"}</h1>
${flags.created ? '<p class="notice">Product created.</p>' : ""}${flags.saved ? '<p class="notice">Changes saved.</p>' : ""}
${flags.slugTaken ? '<p class="error-msg">That slug is already in use — pick a different one.</p>' : ""}${flags.error ? `<p class="error-msg">${esc(flags.error)}</p>` : ""}
${p && p.image_url ? `<div class="card"><img src="${esc(p.image_url)}" alt="" style="max-width:100%;display:block;"></div>` : ""}
<form method="post" action="${p ? `/admin/products/${p.id}` : "/admin/products"}" enctype="multipart/form-data" class="card">
<label for="slug">Slug</label>
${p ? `<input type="text" value="${v(p.slug)}" disabled style="background:var(--paper);">`
    : `<input type="text" id="slug" name="slug" required placeholder="e.g. mercusys-mc200"><p class="muted" style="margin:-10px 0 16px;">Used in the product URL. Letters, numbers and hyphens only — can't be changed later.</p>`}
<label for="name">Name</label><input type="text" id="name" name="name" value="${v(p?.name)}" required>
<label for="brand">Brand</label><input type="text" id="brand" name="brand" value="${v(p?.brand)}" required>
<label for="categoryId">Category</label><select id="categoryId" name="categoryId" required>${cats.map((c) => `<option value="${c.id}"${p && p.category_id === c.id ? " selected" : ""}>${esc(c.label)}</option>`).join("")}</select>
<div class="checkbox-row"><input type="checkbox" id="bundle" name="bundle" value="true"${p?.bundle ? " checked" : ""}${p ? " disabled" : ""}><label for="bundle" style="margin:0;">This is a bundle (multiple items sold together)</label></div>
<label for="sku">SKU</label><input type="text" id="sku" name="sku" value="${v(p?.sku)}">
<label for="tagline">Tagline</label><input type="text" id="tagline" name="tagline" value="${v(p?.tagline)}" required placeholder="One line shown on the product card">
<label for="description">Description</label><textarea id="description" name="description" rows="4" style="width:100%;padding:9px 11px;border:1px solid var(--line);background:#fff;font-size:14px;margin-bottom:16px;">${v(p?.description)}</textarea>
<label for="costPrice">Cost price (R) — internal, never shown to customers</label><input type="number" step="0.01" min="0" id="costPrice" name="costPrice" value="${v(p?.cost_price)}">
<label for="price">Selling price (R)</label><input type="number" step="0.01" min="0" id="price" name="price" value="${v(p?.price)}" required>
<label for="stockQty">Stock quantity</label><input type="number" id="stockQty" name="stockQty" value="${p ? p.stock_qty : 0}" required>
<label for="weightKg">Shipping weight (kg)</label><input type="number" step="0.01" min="0" id="weightKg" name="weightKg" value="${p ? p.weight_kg : 0.5}" required>
<p class="muted" style="margin:-10px 0 16px;">Boxed weight incl. packaging — used to calculate the shipping fee at checkout.</p>
${p ? `<div class="checkbox-row"><input type="checkbox" id="active" name="active"${p.active ? " checked" : ""}><label for="active" style="margin:0;">Active (visible in the store)</label></div>` : ""}
<label for="imageUrl">Image URL / path</label><input type="text" id="imageUrl" name="imageUrl" value="${v(p?.image_url)}" placeholder="/products/your-slug.jpg">
<p class="muted" style="margin:-10px 0 16px;">Photos placed in the project's public/products folder are served at /products/&lt;file&gt;.</p>
${flags.canUpload ? `<label for="image">...or upload a photo now</label><input type="file" id="image" name="image" accept="image/*">
<p class="muted" style="margin:-10px 0 16px;">Stored permanently in Vercel Blob. Leave blank to keep the current photo.</p>` : `<p class="muted" style="margin:-10px 0 16px;">Photo upload is off (set BLOB_READ_WRITE_TOKEN to enable it).</p>`}
<button type="submit" class="primary">${p ? "Save changes" : "Create product"}</button></form>
${p ? `<form method="post" action="/admin/products/${p.id}/delete" onsubmit="return confirm('Delete this product? If it has never been ordered it will be removed completely. If it has order history, it will be deactivated instead and hidden from the store.');" style="margin-top:16px;"><button type="submit" class="danger">Delete product</button></form>` : ""}
</div>`, "products");
};
