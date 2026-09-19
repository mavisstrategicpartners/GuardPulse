#  AI-Smart-Camera-Security

A security-camera e-commerce store for the South African market: React + TypeScript + Vite
frontend, Spring Boot (Java) backend, PayFast payments, Postgres in production. Catalog is
seeded from the 13 real products (Xiaomi + TP-Link) you supplied, with real product photos
extracted from those same supplier docs.


```
 AI-Smart-Camera-Security/
├── backend/     Spring Boot API — catalog, cart, checkout, PayFast, email, admin back-office
├── frontend/    React + TypeScript + Vite storefront
├── deploy/      Caddy config + edge Dockerfile for the HTTPS deployment
├── docker-compose.yml
└── .env.example
```

## ⚠️ A build note from this environment

This project was written and carefully reviewed here but **could not be compiled or run** —
this sandbox can't reach Maven Central (only a small package-registry allowlist is
available, and it doesn't include Java repositories). Build and smoke-test it yourself
before trusting it with real traffic; see "What's genuinely unverified" below for exactly
what that should cover.

## 1. Local development

```bash
cd backend && mvn spring-boot:run      # H2 file database, seeds the catalog automatically
cd frontend && npm install && npm run dev
```

Frontend at `http://localhost:5173`, API at `http://127.0.0.1:8000/api`. Admin back-office
at `http://127.0.0.1:8000/admin` — since `ADMIN_PASSWORD` isn't set by default, a random
password is generated and printed to the backend's console log on every startup (search for
the `====` banner). Set `ADMIN_PASSWORD` as an environment variable once you want it to
stay the same across restarts.

PayFast, in dev, runs against PayFast's own published **sandbox** test credentials by
default (`payfast.sandbox=true`) — real card forms, fake money, safe to click through
repeatedly.

## 2. Production deployment (Docker + Postgres + automatic HTTPS)

```bash
cp .env.example .env    # fill in your real domain, DB password, admin password,
                         # SMTP credentials, and PayFast merchant details
docker compose up -d --build
```

That's the whole deployment. Three containers:
- **`db`** — Postgres 16, schema managed by Flyway migrations (`backend/src/main/resources/db/migration`)
- **`backend`** — the Spring Boot API, running with `--spring.profiles.active=prod`
- **`edge`** — Caddy, serving the built frontend as static files and reverse-proxying
  `/api`, `/admin`, `/media`, `/products` to the backend. Caddy automatically obtains and
  renews a Let's Encrypt certificate for whatever domain you set in `.env` — no certbot,
  no manual renewal, as long as DNS for that domain points at the server and ports 80/443
  are reachable.

Since the frontend and API are served from the same domain through Caddy, CORS is mostly a
non-issue in this topology (the frontend's production build talks to `/api` on its own
origin — see `frontend/.env.production`); `CORS_ALLOWED_ORIGINS` still gets set correctly
for completeness/any direct API callers.

### Environment variables (`.env`, see `.env.example` for the full list with comments)

| Variable | What it's for |
|---|---|
| `DOMAIN` | Your real domain — Caddy gets HTTPS for exactly this |
| `DB_PASSWORD` | Postgres password |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin back-office login — **set both explicitly for production** |
| `SMTP_HOST/PORT/USERNAME/PASSWORD`, `MAIL_FROM`, `MAIL_ADMIN_ADDRESS` | Real email sending |
| `PAYFAST_SANDBOX/MERCHANT_ID/MERCHANT_KEY/PASSPHRASE` | Real PayFast credentials — get these from your PayFast merchant dashboard |
| `STORE_VAT_NUMBER/VAT_RATE_PERCENT/PRICES_INCLUDE_VAT` | Shown on checkout and in order emails |
| `RATELIMIT_PER_MINUTE` | Requests/minute/IP allowed on cart & checkout endpoints |

## 3. What's implemented

### Payment gateway — PayFast

`payment/PayFastService.java` builds the signed field set PayFast requires and validates
incoming payment notifications two ways: signature verification, and PayFast's recommended
server-to-server "confirm this notification actually came from us" callback. Flow:

1. Checkout (`POST /api/orders/`) creates the `Order` as `PENDING`, decrements stock, sends
   an "order placed, payment pending" email.
2. Frontend calls `GET /api/payments/payfast/{reference}/`, gets back the signed fields, and
   auto-submits a hidden form to PayFast (this is how PayFast expects to be called — not a
   plain link).
3. PayFast POSTs a server-to-server ITN (Instant Transaction Notification) to
   `POST /api/payments/payfast/itn` once payment actually completes. **Only this webhook**
   marks an order `PAID` and sends the "payment received" email — the customer's browser
   redirect back to your site is never trusted alone for that.

Get real credentials from your PayFast merchant dashboard, set `PAYFAST_SANDBOX=false`
and the three `PAYFAST_*` secrets, before taking real payments.

### Real email

Toggled by `mail.enabled` — logs to console when `false` (default, zero setup for local
dev), sends real SMTP when `true`. Three distinct emails: order placed, payment confirmed,
and a merchant notification for both, wrapped so a send failure never breaks checkout.

### Admin back-office (`/admin`)

Server-rendered (Thymeleaf), login-protected. Dashboard with low-stock alerts, order
management with status updates, product editing (price/stock/active/photo upload with a
thumbnail preview list). No fixed default password — see the local dev section above.

### Stock tracking

Enforced at add-to-cart (rejected with `409` if it would exceed stock) and at checkout
(decremented inside the same transaction as order creation, using JPA optimistic locking
so two simultaneous checkouts can't both win the last unit — see
`StockConcurrencyTest.java`, which reproduces this race directly).

### Order lookup for guests

`GET /api/orders/lookup?reference=X&email=Y` plus a "Track your order" page (linked from
the footer) for customers who lose their confirmation email. Requires both the reference
and a matching email — a bare reference isn't accepted alone.

### VAT / invoicing

`GET /api/store-info` exposes your VAT number and rate; shown on the checkout page and in
order confirmation emails.

### Rate limiting

A self-contained in-memory per-IP limiter (`config/RateLimitFilter.java`) on cart/checkout/
payment endpoints — deliberately no third-party dependency, since an unverifiable
version-compatibility risk wasn't worth it for something this simple to write directly.
In-memory means it's per-instance; if this ever runs as more than one backend instance
behind a load balancer, move the counters to Redis instead.

### Product photography

Real photos extracted from your supplier docs, wired in for all 13 products — see
`backend/src/main/resources/static/products/`.

### Automated tests

`StockConcurrencyTest` fires two simultaneous checkouts at the last unit of stock and
asserts exactly one wins. `CartAndCheckoutTest` covers stock-limit rejection on add-to-cart,
removing a cart item, and checkout validation (empty cart, invalid cart token). Run with
`mvn test`.

### Legal pages

Five real pages (Returns & Warranty, Privacy/POPIA, Terms, Delivery, Contact) — not filler,
citing ECTA's 7-day cooling-off and CPA's 6-month quality guarantee specifically. Still not
a substitute for an actual lawyer's review — see below.

## 4. What's genuinely unverified — check these before real traffic

- **This has never been compiled or run.** First priority: `mvn spring-boot:run` locally
  and walk a full order through — browse → cart → checkout → PayFast sandbox → confirmation
  → `/admin/orders` shows it → email arrives (console log by default).
- **PayFast sandbox flow end-to-end** — the field-building and ITN handling were written
  against PayFast's published documentation, not tested against their actual sandbox.
- **The `mvn test` run itself** — the two test classes above are written correctly to the
  best of this review, but "written correctly" and "actually passes" aren't the same thing
  until they've run once for real.
- **Docker Compose stack** — `docker compose up --build` end-to-end, including Caddy
  actually obtaining a certificate for your real domain.

## 5. Explicitly not done (wasn't in scope for this round)

- **Shipping cost logic** — still hardcoded to R0 in `frontend/src/pages/Checkout.tsx`.
- **Legal review** — the five legal pages are specific and accurate, not generic filler,
  but a lawyer/POPIA consultant should review them before real customers order, and you
  need an actual registered Information Officer with the Information Regulator (referenced
  on the Privacy page).
- **The store name** — still literally "Nightwatch," pending your final choice.
#   A I - S m a r t - C a m e r a - S e c u r i t y 
 
 
