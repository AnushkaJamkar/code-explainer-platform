function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 30;
  const message = options.message || "Too many requests. Try again later.";
  const buckets = new Map();

  return function rateLimiter(req, res, next) {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({ message });
    }

    return next();
  };
}

module.exports = { createRateLimiter };
