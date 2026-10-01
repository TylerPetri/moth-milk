// Receipt keys authorize guest status reads. Keep them out of URLs and logs.
const receiptKey = 'moth-milk-receipts';
/** @template [T=unknown] @param {string} key @returns {T | null} */
export function readSaved(key) {
  for (const name of /** @type {const} */ (['localStorage', 'sessionStorage'])) {
    try {
      const raw = globalThis[name].getItem(key);
      const value = raw ? JSON.parse(raw) : null;
      if (value && typeof value === 'object') {
        if (key === 'moth-milk-checkout-details' && (!value.savedAt || Date.now() - value.savedAt > 86400000)) { globalThis[name].removeItem(key); continue; }
        if (['moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) { try { const privateBody = JSON.parse(sessionStorage.getItem(`${key}-contact`) || 'null'); if (privateBody?.idempotency_key === value.idempotency_key) value.body = privateBody; } catch {} }
        return /** @type {T} */ (value);
      }
    } catch { /* Try session storage if persistent storage is unavailable. */ }
  }
  return null;
}
/** @param {string} key @param {any} value */
export function writeSaved(key, value) {
  if (value && !Array.isArray(value) && ['moth-milk-checkout-details', 'moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) value = { ...value, savedAt: Date.now() };
  if (key === 'moth-milk-checkout-details') {
    try { localStorage.removeItem(key); if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }
  if (['moth-milk-pending-checkout', 'moth-milk-stub-checkout'].includes(key)) {
    try { if (value === null) sessionStorage.removeItem(`${key}-contact`); else if (value.body?.customer_email) sessionStorage.setItem(`${key}-contact`, JSON.stringify({ ...value.body, idempotency_key: value.idempotency_key })); } catch {}
    if (value?.body) { const { customer_email, customer_name, shipping, ...body } = value.body; value = { ...value, body }; }
  }
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); }
  catch { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); } catch { return false; } return true; }
  try { sessionStorage.removeItem(key); } catch { /* Storage may be restricted. */ }
  return true;
}
/** @returns {import('./types/checkout.js').Receipt[]} */
export function receipts() {
  const saved = readSaved(receiptKey);
  return Array.isArray(saved) ? saved.filter(item => item?.id && (!item.confirmedAt || Date.now() - Date.parse(item.confirmedAt) < 30 * 86400000)) : [];
}
/** @template {import('./types/checkout.js').Receipt} T @param {T} receipt @returns {T} */
export function saveReceipt(receipt) {
  const { body, idempotency_key, tracking_proof, ...safe } = receipt;
  // A new email proof remains in memory until the first successful server status read.
  const stored = { id: safe.id, status: safe.status, total: safe.total, currency: safe.currency, confirmedAt: safe.confirmedAt, shipment: safe.shipment, shipment_unavailable: safe.shipment_unavailable, items: (safe.items || []).map(/** @param {any} item */ ({ name, slug, price, quantity, lineId, image, selectedSize, color }) => ({ name, slug, price, quantity, lineId, image, selectedSize, color })) };
  if (!writeSaved(receiptKey, [stored, ...receipts().filter(item => item.id !== receipt.id)].slice(0, 10))) throw new Error('Your order is confirmed, but this browser could not save the receipt. Keep your order email.');
  return receipt;
}
/** @param {number} amount */
export function money(amount, currency = 'CAD') {
  try { return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount / 100); }
  catch { return `${(amount / 100).toFixed(2)} ${currency}`; }
}
/** @param {string | undefined} status */
export function shipmentLabel(status) {
  /** @type {Record<string, string>} */
  const labels = { pending: 'Your things are waiting to be packed.', allocated: 'Your things are being gathered.', picking: 'Your things are being gathered.', packed: 'Packed and waiting for the carrier.', shipped: 'Your things have shipped.', in_transit: 'Your things are on their way.', delivered: 'Your things have arrived.', cancelled: 'This shipment was cancelled. Contact the shop for the next step.' };
  return labels[status || ''] || 'Shipping has not started yet. Check back here for updates.';
}

export function forgetReceipts() { writeSaved(receiptKey, null); }
