import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.js";
import { HttpError } from "./lib/http.js";
import { rateLimit } from "./lib/ratelimit.js";
import { logPayFastConfig } from "./lib/payfast.js";
import { catalog } from "./routes/catalog.js";
import { cart } from "./routes/cart.js";
import { orders } from "./routes/orders.js";
import { authRoutes } from "./routes/auth.js";
import { payments } from "./routes/payments.js";
import { shipping } from "./routes/shipping.js";
import { admin } from "./admin/routes.js";

export function createApp(app: Hono = new Hono({ strict: false })) {
  
  app.use("/api/*", cors({
    origin: (origin) => (config().corsOrigins.includes(origin) ? origin : null),
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowHeaders: ["*"],
  }));
  app.use("/api/*", rateLimit);

  app.get("/", (c) => c.json({ status: "ok", service: "guardpulse-api" }));
  app.get("/api/health", (c) => c.json({ status: "ok" }));

  app.route("/api", catalog);
  app.route("/api", cart);
  app.route("/api", orders);
  app.route("/api", authRoutes);
  app.route("/api", payments);
  app.route("/api", shipping);
  app.get("/api/store-info", (c) => {
    const s = config().store;
    return c.json({ vat_number: s.vatNumber || null, vat_rate_percent: s.vatRatePercent, prices_include_vat: s.pricesIncludeVat });
  });
  app.route("/admin", admin);

  app.notFound((c) => (new URL(c.req.url).pathname.startsWith("/api") ? c.json({ message: "Not found" }, 404) : c.text("Not found", 404)));

  app.onError((err, c) => {
    if (err instanceof HttpError) return c.json({ message: err.message }, err.status);
    console.error("Unhandled error", err);
    return c.json({ message: "Something went wrong on our side. Please try again shortly." }, 500);
  });

  logPayFastConfig();
  return app;
}
