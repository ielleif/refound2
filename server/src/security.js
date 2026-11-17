// Small, dependency-free protections: request rate limits and browser security headers.

// Allows `max` requests per `windowMs` from one IP address for a given route group.
// Stops password guessing on login, sign-up spam, contact-form spam and upload flooding.
function rateLimit({ name, max, windowMs, message }) {
  const hits = new Map(); // ip -> { count, reset }
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.reset <= now) hits.delete(ip);
  }, Math.min(windowMs, 10 * 60 * 1000)).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let h = hits.get(ip);
    if (!h || h.reset <= now) { h = { count: 0, reset: now + windowMs }; hits.set(ip, h); }
    h.count++;
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.reset - now) / 1000)));
      return res.status(429).json({ error: message || `Too many ${name} attempts. Please wait a few minutes and try again.` });
    }
    next();
  };
}

// Headers that tell browsers to block common tricks (clickjacking, MIME sniffing, leaking URLs).
function securityHeaders(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  });
  next();
}

module.exports = { rateLimit, securityHeaders };
