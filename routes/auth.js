const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

const db = require('../lib/database');
const { authLimiter } = require('../middleware/limiter.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// =============== REGISTER ===============
router.post('/register', authLimiter,
    [
        body('email').notEmpty().withMessage('Email wajib diisi brok').isEmail().withMessage('Lu yakin itu email?'),
        body('username').notEmpty().withMessage('Username wajib diisi brok').isLength({min: 5}).withMessage('Username minimal 5 karakter brok'),
        body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter brok'),
        body('confirmPassword').isLength({ min: 8 }).withMessage('Password harus sama brok, jangan labil')
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { email, username, password, confirmPassword } = req.body;
        if (password !== confirmPassword) return res.status(400).json({ message: "coba cek lagi passwordnya brok, jangan labil" });

        try {
            const existingUser = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
            if (existingUser.rows.length > 0) return res.status(409).json({ error: existingUser.rows[0].username === username ? 'Username already exists!' : 'Email already exists!' });
            const hashedPassword = bcrypt.hashSync(password, 8);
            const result = await db.query('INSERT INTO users (username, email, password, points) VALUES ($1, $2, $3, 0) RETURNING id, username, email', [username, email, hashedPassword]);
            const token = jwt.sign({ id: result.rows[0].id, username: result.rows[0].username }, process.env.JWT_SECRET, {expiresIn: '24h'});
            return res.status(201).json({success: true, message: 'Register berhasil brok' ,token: token });
        } catch (err) {
            if (err.code === '23505') return res.status(409).json({ error: 'username/email udah ada yang punya bro' });
            console.error('Register error: ', err);
            res.status(500).json({error: 'Internal Server Error'});
        }
    });

router.post('/login', authLimiter,
    [
        body('identifier').notEmpty().withMessage('Username/Email diisi dulu dong bro'),
        body('password').notEmpty().withMessage('passwordnya mana bro')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { identifier, password } = req.body;

        try {
            const result = await db.query(
                'SELECT id, username, email, password, points FROM users WHERE username = $1 OR email = $1',
                [identifier]
            );

            const user = result.rows[0];
            if (!user) {
                return res.status(400).json({ error: 'Gw cek belum ada tuh bro' });
            }

            const passwordMatch = bcrypt.compareSync(password, user.password || '');
            if (!passwordMatch) {
                return res.status(401).json({ error: 'passwordnya salah bro' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                user: { id: user.id, username: user.username, points: user.points },
                token,
                message: 'Login berhasil brok'
            });
        } catch (err) {
            console.error('Login error: ', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
);

router.post('/forgot', authLimiter, async (req, res) => {
    const { email } = req.body;
    try {
        const result = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.json({ error: 'Oke, cek email lu ya king' });
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 10 * 60 * 1000;
        await db.query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [token, expires, user.id]);
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS }
        });
        console.log('EMAIL:', process.env.EMAIL);
        console.log('EMAIL_PASS exists:', process.env.EMAIL_PASS);
        const mailOptions = {
            from: `ClimACT Support <${process.env.EMAIL}>`,
            to: email,
            subject: 'Reset Password ClimACT',
            text: `Ada yang mau reset password akun ini nih? kalo emang lu yang mau, gas aja masukkin kode OTP ini: \n\n${token}\n\nToken berlaku 10 menit`
        }
        await transporter.sendMail(mailOptions);
        res.status(200).json({message: 'Coba cek email lu ya king'});
    } catch (err) {
        console.error('Forgot password error: ', err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/reset/check', authLimiter, async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: 'Isi OTP-nya dulu lah bro!' });
    try {
        const result = await db.query('SELECT id FROM users WHERE reset_token = $1 AND reset_expires > $2', [token, Date.now()]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'OTP-nya salah bro, atau udah lewat 10 menit' });
        res.status(200).json({message: 'Okeee', userId: user.id});
    } catch (err) {
        res.status(500).json({error: 'Server Error'});
    }
});

router.post('/reset/new', authLimiter, async (req, res) => {
    const { token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(401).json({ error: 'Yakali akun lu gak ada passwordnya bro, minimal 8 karakter' });
    try {
        const result = await db.query('SELECT id FROM users WHERE reset_token = $1 AND reset_expires > $2', [token, Date.now()]);
        const user = result.rows[0];
        if (!user) return res.status(400).json({error: 'OTP Kadaluarsa, Adiosss'});
        const hashedPassword = bcrypt.hashSync(newPassword, 8);
        await db.query('UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2', [hashedPassword, user.id]);
        res.status(200).json({message: 'Okeee, udah diganti tuh passwordnya', userId: user.id});
    } catch (err) {
        console.error('Reset password error: ', err);
        res.status(500).json({error: 'Server Error'});
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username, email, points FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ user });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;