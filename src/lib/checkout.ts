import type { Receipt, PendingCheckout } from './types/checkout.ts';
// Receipt keys authorize guest status reads. Keep them out of URLs and logs.
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
const receiptKey = 'moth-milk-receipts';
export function readSaved<T = unknown>(key: string): T | null {
  for (const name of (['localStorage', 'sessionStorage'] as const)) {
    try {
      const raw = globalThis[name].getItem(key);
      const value = raw ? JSON.parse(raw) : null;
      if (value && typeof value === 'object') {
        if (key === 'moth-milk-checkout-details' && (!value.savedAt || Date.now() - value.savedAt > 86400000)) { globalThis[name].removeItem(key); continue; }
        if (['moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) { try { const privateBody = JSON.parse(sessionStorage.getItem(`${key}-contact`) || 'null'); if (privateBody?.idempotency_key === value.idempotency_key) value.body = privateBody; } catch {} }
        return value as T;
      }
    } catch { /* Try session storage if persistent storage is unavailable. */ }
  }
  return null;
}
export function writeSaved(key: string, value: unknown) {
  if (isRecord(value) && ['moth-milk-checkout-details', 'moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) value = { ...value, savedAt: Date.now() };
  if (key === 'moth-milk-checkout-details') {
    try { localStorage.removeItem(key); if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }
  if (['moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) {
    try { if (value === null) sessionStorage.removeItem(`${key}-contact`); else if (isRecord(value) && isRecord(value.body) && value.body.customer_email) sessionStorage.setItem(`${key}-contact`, JSON.stringify({ ...value.body, idempotency_key: value.idempotency_key })); } catch {}
    if (isRecord(value) && isRecord(value.body)) { const { customer_email, customer_name, shipping, ...body } = value.body; value = { ...value, body }; }
  }
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); }
  catch { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); } catch { return false; } return true; }
  try { sessionStorage.removeItem(key); } catch { /* Storage may be restricted. */ }
  return true;
}
export function receipts(): Receipt[] {
  const saved = readSaved(receiptKey);
  return Array.isArray(saved) ? saved.filter(item => item?.id && (!item.confirmedAt || Date.now() - Date.parse(item.confirmedAt) < 30 * 86400000)) : [];
}
export function saveReceipt<T extends Receipt>(receipt: T): T {
  const { body, idempotency_key, tracking_proof, ...safe } = receipt;
  // A new email proof remains in memory until the first successful server status read.
  const stored = { id: safe.id, status: safe.status, total: safe.total, currency: safe.currency, confirmedAt: safe.confirmedAt, shipment: safe.shipment, shipment_unavailable: safe.shipment_unavailable, items: (safe.items || []).map(({ name, slug, price, quantity, lineId, image, selectedSize, color }) => ({ name, slug, price, quantity, lineId, image, selectedSize, color })) };
  if (!writeSaved(receiptKey, [stored, ...receipts().filter(item => item.id !== receipt.id)].slice(0, 10))) throw new Error('Your order is confirmed, but this browser could not save the receipt. Keep your order email.');
  removeCheckoutAttempt(receipt.id);
  return receipt;
}
export function money(amount: number, currency = 'CAD') {
  try { return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount / 100); }
  catch { return `${(amount / 100).toFixed(2)} ${currency}`; }
}
export function shipmentLabel(status: string | undefined) {
  const labels: Record<string, string> = { pending: 'Your things are waiting to be packed.', allocated: 'Your things are being gathered.', picking: 'Your things are being gathered.', packed: 'Packed and waiting for the carrier.', shipped: 'Your things have shipped.', in_transit: 'Your things are on their way.', delivered: 'Your things have arrived.', cancelled: 'This shipment was cancelled. Contact the shop for the next step.' };
  return labels[status || ''] || 'Shipping has not started yet. Check back here for updates.';
}

export function forgetReceipts() { writeSaved(receiptKey, null); }

const attemptsKey = 'moth-milk-checkout-attempts';
export function checkoutAttempts(): PendingCheckout[] {
  const saved = readSaved<PendingCheckout[]>(attemptsKey);
  const active = readSaved<PendingCheckout>('moth-milk-pending-checkout');
  const all = [...(active?.id ? [active] : []), ...(Array.isArray(saved) ? saved : [])];
  return [...new Map(all.filter(item => typeof item?.id === 'string' && typeof item?.idempotency_key === 'string').map(item => [item.id, item])).values()].slice(0, 10);
}
export function saveCheckoutAttempt(value: PendingCheckout) {
  if (!value.id) return;
  const safe = [value, ...checkoutAttempts().filter(item => item.id !== value.id)].slice(0, 10).map(item => {
    const { customer_email, customer_name, shipping, ...body } = item.body || {};
    return { ...item, body };
  });
  if (!writeSaved(attemptsKey, safe)) throw new Error('This browser could not save your checkout.');
}
export function removeCheckoutAttempt(id: string) {
  const safe = checkoutAttempts().filter(item => item.id !== id).map(item => {
    const { customer_email, customer_name, shipping, ...body } = item.body || {};
    return { ...item, body };
  });
  writeSaved(attemptsKey, safe);
}
