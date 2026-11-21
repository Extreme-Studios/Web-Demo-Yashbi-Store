import { isIP } from 'node:net';

const WINDOW_MS = 60_000;
const REQUESTS_PER_WINDOW = 8;
const MAX_CLIENTS = 10_000;

export function clientIp(req, onVercel = process.env.VERCEL === '1') {
  // Vercel overwrites this header at ingress. Local requests use the socket.
  const value = onVercel ? req.headers?.['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  const address = typeof value === 'string' ? value.trim().toLowerCase().replace(/^::ffff:/, '') : '';
  return isIP(address) ? address : 'unknown';
}

export function createChatLimiter({
  now = Date.now, windowMs = WINDOW_MS, limit = REQUESTS_PER_WINDOW, maxClients = MAX_CLIENTS,
} = {}) {
  const clients = new Map();
  let nextSweep = 0;
  const retrySeconds = ms => Math.max(1, Math.ceil(ms / 1000));
  return ip => {
    const time = now();
    const cutoff = time - windowMs;
    if (time >= nextSweep) {
      for (const [key, hits] of clients) {
        if (hits[hits.length - 1] <= cutoff) clients.delete(key);
      }
      nextSweep = time + windowMs;
    }

    const existing = clients.get(ip);
    const hits = existing ? existing.filter(timestamp => timestamp > cutoff) : [];
    if (hits.length >= limit) return retrySeconds(hits[0] + windowMs - time);
    if (!existing && clients.size >= maxClients) return retrySeconds(nextSweep - time);
    hits.push(time);
    clients.set(ip, hits);
    return 0;
  };
}
