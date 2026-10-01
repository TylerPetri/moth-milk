import type { CheckoutStatusRequest, Currency, OrderStatus, PrepareOrderRequest, Shipment } from './api.ts';

export interface StoreProduct {
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  sizes: string[];
}
export interface CartLine extends StoreProduct { selectedSize: string; lineId: string; }
export type CheckoutPhase = 'restoring' | 'details' | 'payment' | 'waiting' | 'confirmed' | 'failed';
export type SavedCheckoutBody = Partial<PrepareOrderRequest>;
export interface PendingCheckout extends CheckoutStatusRequest {
  id?: string;
  idempotency_key: string;
  fingerprint?: string;
  body: SavedCheckoutBody;
  items: CartLine[];
  total?: number | null;
  estimatedTotal?: number;
  currency?: Currency;
  paymentSubmitted?: boolean;
  confirmedAt?: string;
}
export interface ReceiptItem {
  name: string;
  slug?: string;
  price?: number;
  quantity?: number;
  lineId?: string;
  image?: string;
  selectedSize?: string;
  color?: string;
}
export interface Receipt extends CheckoutStatusRequest {
  id: string;
  status?: OrderStatus;
  total?: number | null;
  currency?: Currency;
  confirmedAt?: string;
  shipment?: Shipment | null;
  shipment_unavailable?: boolean;
  items?: ReceiptItem[];
  body?: SavedCheckoutBody;
}
