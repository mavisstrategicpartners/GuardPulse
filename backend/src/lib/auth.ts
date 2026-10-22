import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { q, q1 } from "../db.js";
import { HttpError } from "./http.js";

const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000;
const RESET_TTL_MS = 3600 * 1000;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything beyond this

export const sha256 = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");
const newToken = () => randomBytes(32).toString("base64url");
const blankToNull = (s: unknown) => (typeof s !== "string" || !s.trim() ? null : s.trim());

// Compared against when an email isn't registered so "no such user" and "wrong password" take the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export function normalizeEmail(email: unknown): string {
  if (typeof email !== "string" || !email.trim()) throw new HttpError(400, "Please enter your email address.");
  return email.trim().toLowerCase();
}

export function validatePassword(p: unknown): asserts p is string {
  if (typeof p !== "string" || p.length < 8) throw new HttpError(400, "Your password must be at least 8 characters.");
  if (Buffer.byteLength(p, "utf8") > MAX_PASSWORD_BYTES) throw new HttpError(400, "That password is too long (72 characters maximum).");
}

async function issueToken(customerId: number): Promise<string> {
  await q("DELETE FROM auth_tokens WHERE expires_at < now()");
  const token = newToken();
  await q("INSERT INTO auth_tokens (token_hash, customer_id, expires_at) VALUES ($1, $2, $3)", [
    sha256(token), customerId, new Date(Date.now() + TOKEN_TTL_MS),
  ]);
  return token;
}

const emailTaken = () => new HttpError(409, "An account with that email already exists. Try logging in instead.");

export async function register(fullName: string, email: string, phone: unknown, password: string) {
  const normalized = normalizeEmail(email);
  validatePassword(password);
  if (await q1("SELECT 1 FROM customers WHERE lower(email) = $1", [normalized])) throw emailTaken();
  let customer;
  try {
    customer = await q1(
      "INSERT INTO customers (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING *",
      [normalized, await bcrypt.hash(password, 10), fullName.trim(), blankToNull(phone)],
    );
  } catch (e: any) {
    if (e?.code === "23505") throw emailTaken();
    throw e;
  }
  return { token: await issueToken(customer.id), customer };
}

export async function login(email: string, password: string) {
  const found = await q1("SELECT * FROM customers WHERE lower(email) = $1", [normalizeEmail(email)]);
  const ok = await bcrypt.compare(password ?? "", found ? found.password_hash : DUMMY_HASH);
  if (!found || !ok) throw new HttpError(401, "Incorrect email or password.");
  return { token: await issueToken(found.id), customer: found };
}

function extractToken(header: string | undefined | null): string | null {
  if (!header) return null;
  const t = header.trim();
  if (t.length < 8 || t.slice(0, 7).toLowerCase() !== "bearer ") return null;
  const token = t.slice(7).trim();
  return token || null;
}

/** "Authorization: Bearer xxx" -> customer row, or null if missing/invalid/expired. */
export async function resolve(header: string | undefined | null) {
  const token = extractToken(header);
  if (!token) return null;
  return q1(
    `SELECT c.* FROM auth_tokens t JOIN customers c ON c.id = t.customer_id
      WHERE t.token_hash = $1 AND t.expires_at > now()`,
    [sha256(token)],
  );
}

export async function requireCustomer(header: string | undefined | null) {
  const c = await resolve(header);
  if (!c) throw new HttpError(401, "Please log in to continue.");
  return c;
}

export async function logout(header: string | undefined | null) {
  const token = extractToken(header);
  if (token) await q("DELETE FROM auth_tokens WHERE token_hash = $1", [sha256(token)]);
}

export async function updateProfile(customerId: number, fullName: string, phone: unknown) {
  const row = await q1("UPDATE customers SET full_name = $1, phone = $2 WHERE id = $3 RETURNING *", [fullName.trim(), blankToNull(phone), customerId]);
  if (!row) throw new HttpError(401, "Please log in to continue.");
  return row;
}

/** Returns the raw token to email, or null if the address isn't registered (caller reveals nothing either way). */
export async function requestPasswordReset(email: string): Promise<{ customer: any; rawToken: string } | null> {
  await q("DELETE FROM password_reset_tokens WHERE expires_at < now()");
  const customer = await q1("SELECT * FROM customers WHERE lower(email) = $1", [normalizeEmail(email)]);
  if (!customer) return null;
  await q("DELETE FROM password_reset_tokens WHERE customer_id = $1", [customer.id]); // only the newest link works
  const rawToken = newToken();
  await q("INSERT INTO password_reset_tokens (token_hash, customer_id, expires_at) VALUES ($1, $2, $3)", [
    sha256(rawToken), customer.id, new Date(Date.now() + RESET_TTL_MS),
  ]);
  return { customer, rawToken };
}

const invalidReset = () => new HttpError(400, "That reset link is invalid or has expired. Request a new one.");

export async function resetPassword(rawToken: string, newPassword: string) {
  validatePassword(newPassword);
  if (!rawToken || !rawToken.trim()) throw invalidReset();
  const row = await q1("SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > now()", [sha256(rawToken)]);
  if (!row) throw invalidReset();
  await q("UPDATE customers SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(newPassword, 10), row.customer_id]);
  await q("DELETE FROM password_reset_tokens WHERE customer_id = $1", [row.customer_id]);
  await q("DELETE FROM auth_tokens WHERE customer_id = $1", [row.customer_id]); // log out every device
}

/** Admin action: removes the account and sessions but KEEPS orders (customer_id -> NULL). */
export async function deleteAccount(customerId: number) {
  const c = await q1("SELECT id FROM customers WHERE id = $1", [customerId]);
  if (!c) throw new HttpError(404, "Customer not found");
  await q("UPDATE orders SET customer_id = NULL WHERE customer_id = $1", [customerId]);
  await q("DELETE FROM auth_tokens WHERE customer_id = $1", [customerId]);
  await q("DELETE FROM password_reset_tokens WHERE customer_id = $1", [customerId]);
  await q("DELETE FROM customers WHERE id = $1", [customerId]);
}
