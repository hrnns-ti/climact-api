// routes/users.js - FULL CONVERSION dari SQLite → PostgreSQL
const express = require('express');

const db = require('../lib/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/limiter.middleware');

const router = express.Router();

// ================= HELPER: Get or Create Counter =================
async function getOrCreateCounter(userId, counterName, initial = 0) {
    try {
        const result = await db.query(
            'SELECT * FROM user_counters WHERE user_id = $1 AND counter_name = $2',
            [userId, counterName]
        );

        let counter = result.rows[0];

        if (!counter) {
            const insertResult = await db.query(
                'INSERT INTO user_counters (user_id, counter_name, value) VALUES ($1, $2, $3) RETURNING *',
                [userId, counterName, initial]
            );
            counter = insertResult.rows[0];
        }

        return counter;
    } catch (err) {
        console.error('getOrCreateCounter error:', err);
        throw err;
    }
}

// ================= GET USER PROFILE + STATS =================
router.get('/me', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userResult = await db.query('SELECT id, username, email, points FROM users WHERE id = $1', [userId]);
        const user = userResult.rows[0];
        if (!user) return res.status(404).json({ error: 'User not found.' });
        const statsResult = await db.query(`
            SELECT
                COUNT(*) as total_quests,
                COUNT(CASE WHEN completed = true THEN 1 END) as completed_quests,
                COALESCE(SUM(CASE WHEN completed = true THEN progress ELSE 0 END), 0) as total_progress
            FROM user_quests
            WHERE user_id = $1
        `, [userId]);
        const stats = statsResult.rows[0];
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                points: user.points || 0
            },
            stats: {
                total_quests: parseInt(stats.total_quests),
                completed_quests: parseInt(stats.completed_quests),
                total_progress: parseInt(stats.total_progress)
            }
        });
    } catch (err) {
        console.error('Error getting user profile:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= GET USER BADGES =================
router.get('/me/badges', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(`
            SELECT b.id, b.name, b.description, b.image_url, ub.awarded_at
            FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
            WHERE ub.user_id = $1
            ORDER BY ub.awarded_at DESC
        `, [userId]);

        res.json({ badges: result.rows });

    } catch (err) {
        console.error('Get badges error:', err);
        res.status(500).json({ error: 'Gagal mengambil badge user.' });
    }
});

// ================= USER SUMMARY (Counters) =================
router.get('/summary', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await db.query('SELECT counter_name, value FROM user_counters WHERE user_id = $1', [userId]);
        const map = { trash_recycled: 0, tumblr_reused: 0, public_transport: 0 };
        for (const row of result.rows) {
            if (map.hasOwnProperty(row.counter_name)) { map[row.counter_name] = parseInt(row.value); }
        }
        res.json({ trashRecycled: map.trash_recycled, tumblrReused: map.tumblr_reused, publicTransportUsed: map.public_transport });
    } catch (err) {
        console.error('Summary error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= INCREMENT COUNTER =================
router.post('/:counterName/inc', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { counterName } = req.params;
        const { amount = 1 } = req.body;
        const counter = await getOrCreateCounter(userId, counterName, 0);
        const newValue = counter.value + parseInt(amount);
        await db.query('UPDATE user_counters SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newValue, counter.id]);
        res.json({ message: 'Counter increased', counter: {name: counterName, value: newValue} });
    } catch (err) {
        console.error('Increment counter error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= DECREMENT COUNTER =================
router.post('/:counterName/dec', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { counterName } = req.params;
        const { amount = 1 } = req.body;
        const counter = await getOrCreateCounter(userId, counterName, 0);
        const newValue = Math.max(0, counter.value - parseInt(amount));
        await db.query('UPDATE user_counters SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newValue, counter.id]);
        res.json({ message: 'Counter decreased', counter: {name: counterName, value: newValue} });
    } catch (err) {
        console.error('Decrement counter error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
