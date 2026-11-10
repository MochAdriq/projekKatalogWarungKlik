// Pembatas laju sederhana di memori, per alamat IP (cukup untuk satu proses PM2).
export const createRateLimiter = ({ windowMs, max, message }) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        success: false,
        message: message || "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
      });
    }
    next();
  };
};

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Terlalu banyak percobaan masuk/daftar. Coba lagi dalam 15 menit.",
});

export const orderLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Terlalu banyak pesanan dalam waktu singkat. Coba lagi beberapa menit lagi.",
});

