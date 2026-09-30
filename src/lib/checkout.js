// Receipt keys authorize guest status reads. Keep them out of URLs and logs.
const receiptKey = 'moth-milk-receipts';
/** @param {string} key @returns {any} */
export function readSaved(key) {
  for (const name of /** @type {const} */ (['localStorage', 'sessionStorage'])) {
    try {
      const raw = globalThis[name].getItem(key);
      const value = raw ? JSON.parse(raw) : null;
      if (value && typeof value === 'object') return value;
    } catch { /* Try session storage if persistent storage is unavailable. */ }
  }
  return null;
}
/** @param {string} key @param {unknown} value */
export function writeSaved(key, value) {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); }
  catch { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, JSON.stringify(value)); } catch { return false; } return true; }
  try { sessionStorage.removeItem(key); } catch { /* Storage may be restricted. */ }
  return true;
}
export function receipts() {
  const saved = readSaved(receiptKey);
  return Array.isArray(saved) ? saved.filter(item => item?.id && (item.idempotency_key || item.tracking_proof)) : [];
}
/** @param {any} receipt */
export function saveReceipt(receipt) {
  if (!writeSaved(receiptKey, [receipt, ...receipts().filter(item => item.id !== receipt.id)].slice(0, 50))) throw new Error('Your order is confirmed, but this browser could not save the receipt. Keep your order email.');
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
