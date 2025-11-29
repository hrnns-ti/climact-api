const { body, validationResult } = require('express-validator');

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username 3-50 karakter')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username hanya huruf, angka, underscore'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Email tidak valid')
        .isLength({ max: 100 })
        .withMessage('Email terlalu panjang')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password minimal 6 karakter'),
];

const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username wajib diisi'),

    body('password')
        .notEmpty()
        .withMessage('Password wajib diisi'),
];

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    validate,
};
