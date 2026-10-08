import axios from "axios";
import type {
  ProductSummary,
  ProductDetail,
  CategoryOption,
  Cart,
  CheckoutPayload,
  Order,
  Paginated,
  Customer,
} from "../types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({ baseURL: API_BASE_URL });

/** Attaches the logged-in customer's token to every request, if there is one. */
api.interceptors.request.use((config) => {
  const token = getStoredCustomerToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Product photos come back as server-relative paths (e.g. "/media/x.jpg"); resolve against the API host. */
export function resolveImageUrl(path: string | null): string | null {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}

// ---- Catalog ----

export async function fetchCategories(): Promise<CategoryOption[]> {
  const { data } = await api.get<Paginated<CategoryOption>>("/categories/");
  return data.results;
}

export async function fetchProducts(params?: { category?: string; bundle?: boolean }): Promise<ProductSummary[]> {
  const { data } = await api.get<Paginated<ProductSummary>>("/products/", {
    params: {
      category: params?.category,
      bundle: params?.bundle ? "true" : undefined,
    },
  });
  return data.results;
}

export async function fetchProduct(slug: string): Promise<ProductDetail> {
  const { data } = await api.get<ProductDetail>(`/products/${slug}/`);
  return data;
}

// ---- Cart ----

const CART_TOKEN_KEY = "ai_smart_camera_security_cart_token";

export function getStoredCartToken(): string | null {
  return localStorage.getItem(CART_TOKEN_KEY);
}

function storeCartToken(token: string) {
  localStorage.setItem(CART_TOKEN_KEY, token);
}

export function clearStoredCartToken() {
  localStorage.removeItem(CART_TOKEN_KEY);
}

async function createCart(): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/");
  storeCartToken(data.token);
  return data;
}

/** Fetches the current cart, transparently creating a new one if none exists yet or the stored token is stale. */
export async function getOrCreateCart(): Promise<Cart> {
  const token = getStoredCartToken();
  if (!token) return createCart();
  try {
    const { data } = await api.get<Cart>(`/cart/${token}/`);
    return data;
  } catch {
    return createCart();
  }
}

export async function addCartItem(cartToken: string, productSlug: string, quantity = 1): Promise<Cart> {
  const { data } = await api.post<Cart>(`/cart/${cartToken}/items/`, {
    product_slug: productSlug,
    quantity,
  });
  return data;
}

export async function setCartItemQuantity(cartToken: string, itemId: number, quantity: number): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/cart/${cartToken}/items/${itemId}/`, { quantity });
  return data;
}

export async function removeCartItem(cartToken: string, itemId: number): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/${cartToken}/items/${itemId}/`);
  return data;
}

// ---- Checkout ----

export async function submitOrder(payload: CheckoutPayload): Promise<Order> {
  const { data } = await api.post<Order>("/orders/", payload);
  clearStoredCartToken(); // backend clears the cart's items; start a fresh cart next visit
  return data;
}

export async function fetchOrder(reference: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${reference}/`);
  return data;
}

/** For guest customers who lost their confirmation email — requires the exact email on the order. */
export async function fetchOrderByEmail(reference: string, email: string): Promise<Order> {
  const { data } = await api.get<Order>("/orders/lookup", { params: { reference, email } });
  return data;
}

// ---- Payment (PayFast) ----

export interface PayFastInit {
  process_url: string;
  fields: Record<string, string>;
}

/** Fetches the PayFast redirect fields for a just-created (still PENDING) order. */
export async function initPayFastPayment(reference: string): Promise<PayFastInit> {
  const { data } = await api.get<PayFastInit>(`/payments/payfast/${reference}/`);
  return data;
}

/** Builds a hidden form and submits it, navigating the browser to PayFast — this is how PayFast expects to be called, not a plain link. */
export function redirectToPayFast(init: PayFastInit) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = init.process_url;
  for (const [key, value] of Object.entries(init.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

// ---- Shipping ----

export interface ShippingQuote {
  fee: number;
  weight_kg: number;
}

/**
 * Live estimate for the checkout page — the order's real shipping_fee is always
 * recomputed server-side from the same logic at checkout time, so this is a preview,
 * not something the client can influence.
 */
export async function fetchShippingQuote(cartToken: string): Promise<ShippingQuote> {
  const { data } = await api.get<ShippingQuote>("/shipping/quote", { params: { cart_token: cartToken } });
  return data;
}

// ---- Customer accounts ----

const CUSTOMER_TOKEN_KEY = "guardpulse_customer_token";

export function getStoredCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function storeCustomerToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearStoredCustomerToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

interface AuthResponse {
  token: string;
  customer: Customer;
}

export async function registerCustomer(payload: {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<Customer> {
  const { data } = await api.post<AuthResponse>("/auth/register", {
    fullName: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
  });
  storeCustomerToken(data.token);
  return data.customer;
}

export async function loginCustomer(email: string, password: string): Promise<Customer> {
  const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
  storeCustomerToken(data.token);
  return data.customer;
}

export async function logoutCustomer(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    clearStoredCustomerToken();
  }
}

export async function fetchCurrentCustomer(): Promise<Customer> {
  const { data } = await api.get<Customer>("/auth/me");
  return data;
}

export async function updateCustomerProfile(payload: { full_name: string; phone?: string }): Promise<Customer> {
  const { data } = await api.patch<Customer>("/auth/me", {
    fullName: payload.full_name,
    phone: payload.phone,
  });
  return data;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>("/auth/orders");
  return data;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post("/auth/reset-password", { token, newPassword });
}

/** Pulls the backend's {"message": "..."} error body out of an axios error, or falls back. */
export function errorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || fallback;
}