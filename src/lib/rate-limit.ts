interface RateLimitStore {
  [key: string]: { count: number; expiresAt: number };
}

const store: RateLimitStore = {};

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store[identifier];

  if (!entry || now > entry.expiresAt) {
    store[identifier] = { count: 1, expiresAt: now + windowMs };
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}
