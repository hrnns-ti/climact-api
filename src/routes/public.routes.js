import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/leaderboard', (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const offset = (page - 1) * limit;
        const result = db.prepare(`
          SELECT id, username, points
          FROM users
          ORDER BY points DESC, id ASC
          LIMIT ? OFFSET ?
        `).all(limit, offset);

        const users = result.map((user, index) => ({
            rank: offset + index + 1,
            id: user.id,
            username: user.username,
            points: user.points
        }));

        res.json({
            users,
            halaman: page,
            batas_per_halaman: limit,
            jumlah_terambil: users.length
        });
    } catch (err) {
        console.error('Gagal mengambil leaderboard:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
    }
});

export default router;