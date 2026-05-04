const TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  result: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function prune(): void {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt <= now) cache.delete(k);
  }
}

export function getCached<T>(userId: string, key: string): T | undefined {
  prune();
  const entry = cache.get(`${userId}:${key}`);
  if (entry && entry.expiresAt > Date.now()) return entry.result as T;
  return undefined;
}

export function setCached<T>(userId: string, key: string, result: T): void {
  cache.set(`${userId}:${key}`, { result, expiresAt: Date.now() + TTL_MS });
}
