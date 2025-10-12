import rateLimit from 'express-rate-limit';

// Limiter biasa(anggap template)
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});

// Limiter auth
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Terlalu banyak percobaan login, coba lagi nanti.' }
});