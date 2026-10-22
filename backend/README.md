# GuardPulse API (Vercel)

TypeScript (Hono) + Postgres rewrite of the old Spring Boot backend. Same URLs, same JSON, so the
React frontend needs **no changes** apart from `VITE_API_URL` if the API domain changes.

## Deploy
1. **Database** – create a Postgres database (Vercel Marketplace → Neon; pick Frankfurt/`eu-central-1`
   and keep `regions` in `vercel.json` as `fra1`). Copy its *pooled* connection string.
2. **Move your data** (only if you already have orders/customers on Render):
   `pg_dump --no-owner --no-acl "$RENDER_DATABASE_URL" | psql "$NEW_DATABASE_URL"`
   then `DATABASE_URL=… npm run migrate` (it recognises the old Flyway history and only adds V6).
   Fresh start instead: `DATABASE_URL=… npm run migrate && npm run seed`.
3. **Vercel project** – import this folder, then add the environment variables from `.env.example`
   (Project → Settings → Environment Variables). Real keys go there only, never in git.
4. **Domain** – add `api.guardpulse.co.za` to the Vercel project; in Cloudflare point the `api` CNAME at the
   target Vercel shows (DNS only / grey cloud). Update `PAYFAST_NOTIFY_URL` if it changes.
5. Check `https://api.guardpulse.co.za/api/health`, then the admin at `/admin/login`.

## Everyday commands
`npm run dev` local server · `npm test` integration tests (needs a local Postgres) ·
`npm run migrate` apply new SQL in `db/migrations` · `npm run seed` refresh catalogue wording / add missing products.

## Differences from the Java version
- Emails are sent via Resend only (SMTP is gone). Each send is registered with `waitUntil`, so it finishes after the response.
- Rate limiting lives in Postgres (works across serverless instances).
- Admin login is a signed cookie; set `ADMIN_PASSWORD` and a long `SESSION_SECRET` (no random fallback password).
- Photo upload uses Vercel Blob (`BLOB_READ_WRITE_TOKEN`); photos in `public/products` are served at `/products/<file>`.
- The catalogue is no longer re-synced on every start — run `npm run seed` when you change wording.
