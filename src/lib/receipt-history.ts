import type { CheckoutStatusResponse } from './types/api.ts';
import type { Receipt } from './types/checkout.ts';
type Summary = Pick<Receipt, 'status' | 'shipment'> & Pick<CheckoutStatusResponse, 'checkout_state'>;
export function receiptGroup(item: Summary): 'current' | 'history' {
  if (['processing', 'payment_received', 'refund_pending', 'recovery_pending'].includes(item.checkout_state || '')) return 'current';
  if (item.checkout_state === 'closed' || ['failed', 'cancelled', 'expired', 'refunded'].includes(item.status || '')) return 'history';
  if (item.status === 'confirmed') return item.shipment?.status && !['delivered', 'cancelled'].includes(item.shipment.status) ? 'current' : 'history';
  return 'current';
}
export function receiptLabel(item: Summary): string {
  const labels: Record<string, string> = { not_started: 'Payment never started.', awaiting_payment: 'Left open, waiting for you.', recovery_pending: 'Still waiting for news.', processing: 'Your payment is still moving.', payment_received: 'Payment received. Finishing your order.', refund_pending: 'Your payment is being returned.', refunded: 'Your payment was returned.', closed: 'This checkout is closed.' };
  if (labels[item.checkout_state || '']) return labels[item.checkout_state || ''];
  if (item.status === 'confirmed') return item.shipment?.status === 'delivered' ? 'Your things have arrived.' : 'All yours. Your order is confirmed.';
  const statuses: Record<string, string> = { cancelled: 'This checkout was cancelled.', expired: 'This checkout has expired.', failed: 'This checkout could not be completed.', refunded: 'Your payment was returned.', paid: labels.payment_received };
  return statuses[item.status || ''] || labels.recovery_pending;
}
