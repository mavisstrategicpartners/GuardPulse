export type Category = "indoor" | "outdoor" | "solar";

export interface CategoryOption {
  id: number;
  key: Category;
  label: string;
  order: number;
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  brand: "xiaomi" | "tplink";
  category: Category;
  is_bundle: boolean;
  tagline: string;
  price: string | number; // Jackson serializes BigDecimal as a JSON number
  stock_qty: number;
  image: string | null;
}

export interface ProductDetail extends ProductSummary {
  sku: string;
  description: string;
  specs: { text: string }[];
}

export interface CartItem {
  id: number;
  product: ProductSummary;
  quantity: number;
  subtotal: string | number;
}

export interface Cart {
  token: string;
  items: CartItem[];
  total: string | number;
}

export interface CheckoutPayload {
  cart_token: string;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  // shipping_fee intentionally omitted — the backend computes it server-side from the
  // cart's actual weight (see ShippingService) and would reject an unrecognized field.
}

export interface OrderItem {
  product_name: string;
  unit_price: string | number;
  quantity: number;
  subtotal: string | number;
}

export interface Order {
  reference: string;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  shipping_fee: string | number;
  total: string | number;
  created_at: string;
  items: OrderItem[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---- Customer accounts ----

export interface Customer {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}