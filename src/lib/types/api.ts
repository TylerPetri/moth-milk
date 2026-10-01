/** Wire contracts used by this storefront. Monetary amounts are minor units (cents).
 * These types describe data; they do not validate JSON received from the API.
 */
export type UUID = string;
export type Currency = string;
export type OrderStatus = 'reserved' | 'paid' | 'confirmed' | 'cancelled' | 'failed' | 'expired' | 'refunded';

export interface ApiOptions extends RequestInit {
  token?: string;
  noShop?: boolean;
  timeoutMs?: number;
}
export interface ApiErrorResponse {
  error: string;
  message?: string;
  request_id?: string;
}
export interface ApiFailure extends Error {
  status?: number;
  code?: string;
  retryable?: boolean;
}
export interface ProductAttributes {
  style_slug?: string;
  size?: string;
  [key: string]: unknown;
}
export interface Product {
  id: UUID;
  sku?: string;
  name?: string;
  is_active: boolean;
  amount: number;
  currency: Currency;
  attributes?: ProductAttributes;
}
export interface CatalogResponse { products: Product[]; }
export interface StockResponse { available: number; }
export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}
export interface CheckoutItemRequest { product_id: UUID; quantity: number; }
/** Prices come from the backend, not the browser's display data. */
export interface PrepareOrderRequest {
  idempotency_key: UUID;
  customer_email: string;
  customer_name: string;
  currency: Currency;
  tax_country?: string;
  tax_region?: string;
  shipping: ShippingAddress;
  items: CheckoutItemRequest[];
}
export interface PrepareOrderResponse {
  id: UUID;
  total: number;
  status: OrderStatus;
  payment_client_secret: string;
}
export interface CheckoutStatusRequest {
  idempotency_key?: UUID;
  tracking_proof?: string;
}
export interface Shipment {
  // Keep carrier statuses extensible; unfamiliar statuses get a safe UI fallback.
  status: string;
  carrier?: string;
  tracking_number?: string;
}
export interface CheckoutStatusResponse {
  id: UUID;
  status: OrderStatus;
  success?: boolean;
  shipment?: Shipment | null;
  shipment_unavailable?: boolean;
}
export interface OrderItem {
  product_id: UUID;
  sku?: string;
  name?: string;
  quantity: number;
  unit_price?: number;
  currency?: Currency;
  line_total?: number;
}
export interface Order {
  id: UUID;
  status: OrderStatus;
  items: OrderItem[];
  currency: Currency;
  subtotal?: number;
  total?: number;
  created_at?: string;
}
export interface OrderHistoryResponse { orders: Order[]; count?: number; }
export interface AccountResponse {
  user_id: UUID;
  email: string;
  email_verified: boolean;
}
/** Browser session responses contain cookie-session markers, not real tokens. */
export interface SessionResponse {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  user_id: UUID;
  email_verified: boolean;
  shop_id?: UUID;
}
export interface LoginRequest { email: string; password: string; email_proof_token?: string; }
export interface RegisterRequest extends LoginRequest { locale: string; }
export interface BooksResponse { books: string[]; }
export interface ReceiptImportRequest extends CheckoutStatusRequest { id: UUID; }
export interface RecoveryResponse {
  // Recovery cookies contain contact details, not the full item list.
  body: Pick<PrepareOrderRequest, 'idempotency_key' | 'customer_email' | 'customer_name' | 'shipping'> | null;
}

/** Response lookup for exact routes and parameterized order/stock routes. */
export interface ApiResponses {
  '/v1/products': CatalogResponse;
  '/v1/auth/me': AccountResponse;
  '/v1/auth/login': SessionResponse;
  '/v1/auth/register': SessionResponse;
  '/v1/auth/refresh': SessionResponse;
  '/v1/auth/me/shops/switch': SessionResponse;
  '/v1/auth/me/books': BooksResponse;
  '/v1/auth/recovery': RecoveryResponse;
  '/v1/orders/prepare': PrepareOrderResponse;
}
export type ApiResponseFor<Path extends string> =
  Path extends keyof ApiResponses ? ApiResponses[Path] :
  Path extends `/v1/products?${string}` ? CatalogResponse :
  Path extends `/v1/stock/${string}` ? StockResponse :
  Path extends `/v1/orders/${string}/checkout-status` ? CheckoutStatusResponse :
  Path extends `/v1/users/${string}/orders${string}` ? OrderHistoryResponse :
  unknown;
