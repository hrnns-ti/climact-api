// routes/public.js - PUBLIC ENDPOINTS (no auth required)
const express = require('express');
const db = require('../lib/database');
const { apiLimiter } = require('../middleware/limiter.middleware');

const router = express.Router();

// ================= LEADERBOARD (Top Users by Points) =================
router.get('/leaderboard', apiLimiter, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const offset = (page - 1) * limit;

        const leaderboardResult = await db.query(`
            SELECT id, username, points
            FROM users 
            WHERE points > 0
            ORDER BY points DESC, id ASC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countResult = await db.query('SELECT COUNT(*) as total FROM users WHERE points > 0');
        const totalUsers = parseInt(countResult.rows[0].total);

        const users = leaderboardResult.rows.map((user, index) => ({
            rank: offset + index + 1,
            id: user.id,
            username: user.username,
            points: parseInt(user.points)
        }));

        res.json({
            users,
            pagination: {
                page,
                limit,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit),
                hasNext: page * limit < totalUsers
            }
        });

    } catch (err) {
        console.error('Gagal mengambil leaderboard:', err);
        res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
    }
});

// ================= USER RANK BY ID =================
router.get('/leaderboard/:id', apiLimiter, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const rankResult = await db.query(`
            SELECT id, points, rank 
            FROM (
                SELECT id, points, 
                       ROW_NUMBER() OVER (ORDER BY points DESC NULLS LAST, id ASC) AS rank 
                FROM users
            ) ranked_users 
            WHERE id = $1
        `, [userId]);

        const userRank = rankResult.rows[0];
        if (!userRank) {
            return res.status(404).json({ error: 'User Not Found' });
        }

        const userResult = await db.query(
            'SELECT username, points FROM users WHERE id = $1',
            [userId]
        );

        res.json({
            userId: userRank.id,
            username: userResult.rows[0].username,
            rank: parseInt(userRank.rank),
            points: parseInt(userRank.points)
        });

    } catch (err) {
        console.error('Failed to get user rank:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ================= ALL BADGES (Public List) =================
router.get('/badges', apiLimiter, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, description, requirement, image_url
            FROM badges
            ORDER BY name ASC
        `);

        res.json({
            badges: result.rows,
            count: result.rowCount
        });

    } catch (err) {
        console.error('Error fetching badges:', err);
        res.status(500).json({ error: 'Error fetching badges.' });
    }
});

// ================= POPULAR QUESTS (Bonus - most started) =================
router.get('/popular-quests', apiLimiter, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        const result = await db.query(`
            SELECT 
                q.id, q.name, q.description, q.category, q.points, q.target,
                COUNT(uq.id) as started_count
            FROM quest q
            LEFT JOIN user_quests uq ON q.id = uq.quest_id
            WHERE q.is_active = true
            GROUP BY q.id
            ORDER BY started_count DESC, q.points DESC
            LIMIT $1
        `, [limit]);

        res.json({
            popularQuests: result.rows,
            count: result.rowCount
        });

    } catch (err) {
        console.error('Error fetching popular quests:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
