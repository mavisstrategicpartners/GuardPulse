import { Hono } from "hono";
import { q } from "../db.js";
import { HttpError, jsonBody, validate } from "../lib/http.js";
import * as auth from "../lib/auth.js";
import { customerDto, orderDto } from "../lib/dto.js";
import { notifyPasswordReset } from "../lib/notify.js";

export const authRoutes = new Hono();
const hdr = (c: any) => c.req.header("authorization");

authRoutes.post("/auth/register", async (c) => {
  const b = await jsonBody(c);
  validate(b, [
    { field: "full_name", label: "fullName", required: true, max: 120 },
    { field: "email", label: "email", required: true, email: true, max: 254 },
    { field: "phone", label: "phone", max: 30 },
    { field: "password", label: "password", required: true, min: 8, max: 72 },
  ]);
  const r = await auth.register(b.full_name, b.email, b.phone, b.password);
  return c.json({ token: r.token, customer: customerDto(r.customer) }, 201);
});

authRoutes.post("/auth/login", async (c) => {
  const b = await jsonBody(c);
  validate(b, [{ field: "email", label: "email", required: true }, { field: "password", label: "password", required: true }]);
  const r = await auth.login(b.email, b.password);
  return c.json({ token: r.token, customer: customerDto(r.customer) });
});

authRoutes.post("/auth/logout", async (c) => {
  await auth.logout(hdr(c));
  return c.body(null, 204);
});

authRoutes.get("/auth/me", async (c) => c.json(customerDto(await auth.requireCustomer(hdr(c)))));

authRoutes.patch("/auth/me", async (c) => {
  const me = await auth.requireCustomer(hdr(c));
  const b = await jsonBody(c);
  validate(b, [{ field: "full_name", label: "fullName", required: true, max: 120 }, { field: "phone", label: "phone", max: 30 }]);
  return c.json(customerDto(await auth.updateProfile(me.id, b.full_name, b.phone)));
});

authRoutes.get("/auth/orders", async (c) => {
  const me = await auth.requireCustomer(hdr(c));
  const rows = await q("SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC, id DESC", [me.id]);
  return c.json(await Promise.all(rows.map(orderDto)));
});

// Always answers the same way whether or not the email is registered.
authRoutes.post("/auth/forgot-password", async (c) => {
  const b = await jsonBody(c);
  validate(b, [{ field: "email", label: "email", required: true, email: true, max: 254 }]);
  const r = await auth.requestPasswordReset(b.email);
  if (r) await notifyPasswordReset(r.customer.email, r.customer.full_name, r.rawToken);
  return c.json({ message: "If that email has an account, we've sent a reset link." });
});

authRoutes.post("/auth/reset-password", async (c) => {
  const b = await jsonBody(c);
  validate(b, [
    { field: "token", label: "token", required: true },
    { field: "new_password", label: "newPassword", required: true, min: 8, max: 72 },
  ]);
  await auth.resetPassword(b.token, b.new_password);
  return c.json({ message: "Your password has been reset. You can log in now." });
});

export { HttpError };
