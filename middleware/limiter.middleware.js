const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 10, // max 10 login/register per IP
    message: { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // max 100 API calls per IP
    message: { error: 'Terlalu banyak request, coba lagi nanti' },
});

module.exports = { authLimiter, apiLimiter };
