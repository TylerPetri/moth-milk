import { createHash } from 'node:crypto';
// Coalesce overlapping SSR/tab renewals; never retain a completed credential.
const pending = new Map<string, Promise<{ status: number; data: Record<string, unknown> }>>();
export async function coordinatedRefresh(shop: string, token: string, renew: () => Promise<{ status: number; data: Record<string, unknown> }>) {
  const key = createHash('sha256').update(shop + ':' + token).digest('hex');
  let request = pending.get(key);
  if (!request) {
    request = renew().finally(() => pending.delete(key));
    pending.set(key, request);
  }
  const result = await request;
  return { ...result, data: { ...result.data } };
}
