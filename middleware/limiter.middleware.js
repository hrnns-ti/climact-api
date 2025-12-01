const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100,
    message: { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 1000,
    message: { error: 'Terlalu banyak request, coba lagi nanti' },
});

module.exports = { authLimiter, apiLimiter };
