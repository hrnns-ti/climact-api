const express = require('express');
const { getISOWeek, getYear } = require('date-fns');

const db = require('../lib/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/limiter.middleware');
const { awardBadgesForUser, calculateStreakForUser } = require('../controller/badge.controller');

const router = express.Router();

// ================= HELPERS =================
function isValidDaily(periode) {
    const today = new Date().toISOString().slice(0, 10);
    return periode === today;
}

function isValidWeekly(periode) {
    const now = new Date();
    const currentWeek = `${getYear(now)}-W${getISOWeek(now).toString().padStart(2, '0')}`;
    return periode === currentWeek;
}

async function ensureOwnership(req, res, next) {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const result = await db.query('SELECT * FROM user_quests WHERE id = $1', [id]);
        const userQuest = result.rows[0];
        if (!userQuest) return res.status(404).json({ error: 'User quest not found' });
        if (userQuest.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
        req.userQuest = userQuest;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

async function getUserQuestCount(userId) {
    const result = await db.query(
        'SELECT COUNT(*) as total FROM user_quests WHERE user_id = $1 AND completed = true',
        [userId]
    );
    return parseInt(result.rows[0].total);
}

// ================= START QUEST =================
router.post('/start', apiLimiter, verifyToken, async (req, res) => {
    const { quest_id, periode } = req.body;
    const userId = req.user.id;

    // 1. VALIDASI INPUT
    if (!quest_id || !periode) return res.status(400).json({ error: 'quest_id dan periode wajib diisi bro' });

    try {
        const questCheck = await db.query('SELECT id, name, deadline, category FROM quest WHERE id = $1 AND deadline > NOW()', [quest_id]);
        if (questCheck.rows.length === 0) return res.status(400).json({ error: 'Quest ga ada atau udah expired bro' });
        const existingCheck = await db.query('SELECT id FROM user_quests WHERE user_id = $1 AND quest_id = $2 AND periode = $3', [userId, quest_id, periode]);

        if (existingCheck.rows.length > 0) return res.status(409).json({ error: 'Quest ini udah lu mulai di periode ini bro' });

        const result = await db.query(
            `INSERT INTO user_quests (user_id, quest_id, periode, progress, completed, started)
             VALUES ($1, $2, $3, 0, false, NOW())
             RETURNING id, user_id, quest_id, periode, progress, completed, started`,
            [userId, quest_id, periode]
        );

        res.status(201).json({ message: 'Quest started successfully', ...result.rows[0]});

    } catch (err) {
        console.error('Error starting quest:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= UPDATE PROGRESS =================
router.patch('/:id/progress', [apiLimiter, verifyToken, ensureOwnership], async (req, res) => {
    try {
        const { id } = req.params;
        const increment = parseInt(req.body.increment) || 1;
        if (isNaN(increment) || increment <= 0) return res.status(400).json({ error: 'Increment harus angka positif' });
        const userQuest = req.userQuest;
        if (userQuest.completed) return res.status(400).json({ error: 'Quest sudah complete' });
        const questResult = await db.query('SELECT target, deadline, category, points FROM quest WHERE id = $1', [userQuest.quest_id]);
        const quest = questResult.rows[0];
        if (!quest) return res.status(404).json({ error: 'Quest definition not found' });
        if (quest.deadline && new Date() > new Date(quest.deadline)) return res.status(400).json({ error: 'Quest sudah lewat deadline' });
        if (quest.category === 'daily' && !isValidDaily(userQuest.periode)) return res.status(400).json({ error: 'Periode daily hanya boleh hari ini' });
        if (quest.category === 'weekly' && !isValidWeekly(userQuest.periode)) return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini' });

        let newProgress = userQuest.progress + increment;
        let completed = false;
        let finished = null;
        let pointsEarned = 0;

        if (newProgress >= quest.target) {
            newProgress = quest.target;
            completed = true;
            finished = new Date();
            pointsEarned = quest.points;
            await db.query('UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [quest.points, userQuest.user_id]);

            const streakData = await calculateStreakForUser(userQuest.user_id);
            const userDataResult = await db.query(
                'SELECT points FROM users WHERE id = $1',
                [userQuest.user_id]
            );
            const userData = userDataResult.rows[0];
            const user = {
                id: userQuest.user_id,
                points: userData.points,
                questsCompleted: await getUserQuestCount(userQuest.user_id),
                streakDays: streakData.streakCount
            };
            await awardBadgesForUser(user);
            console.log(`User ${userQuest.user_id} completed quest ${userQuest.quest_id}, earned ${quest.points} points, streak: ${streakData.streakCount}`);
        }

        await db.query('UPDATE user_quests SET progress = $1, completed = $2, finished = $3 WHERE id = $4', [newProgress, completed, finished, id]);
        res.json({
            message: completed ? 'Quest completed! Points awarded!' : 'Progress updated',
            progress: newProgress,
            target: quest.target,
            completed,
            points_earned: pointsEarned,
            finished: finished ? finished.toISOString() : null
        });

    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= MANUAL COMPLETE =================
router.patch('/:id/complete', [apiLimiter, verifyToken, ensureOwnership], async (req, res) => {
    try {
        const { id } = req.params;
        const userQuest = req.userQuest;
        const questResult = await db.query('SELECT category, deadline, points FROM quest WHERE id = $1', [userQuest.quest_id]);
        const quest = questResult.rows[0];
        if (!quest) return res.status(404).json({ error: 'Quest definition not found' });

        if (quest.deadline && new Date() > new Date(quest.deadline)) return res.status(400).json({ error: 'Quest sudah lewat deadline' });
        if (quest.category === 'daily' && !isValidDaily(userQuest.periode)) return res.status(400).json({ error: 'Periode daily hanya boleh hari ini' });
        if (quest.category === 'weekly' && !isValidWeekly(userQuest.periode)) return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini' });
        if (userQuest.completed) return res.status(400).json({ error: 'Quest sudah complete' });

        const finish = new Date();
        const result = await db.query('UPDATE user_quests SET completed = true, finished = $1 WHERE id = $2 RETURNING *', [finish, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Quest tidak ditemukan' });
        await db.query('UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [quest.points, userQuest.user_id]);
        console.log(`User ${userQuest.user_id} manually completed quest ${userQuest.quest_id}`);
        res.json({ message: 'Quest marked as completed! Points awarded!', points_earned: quest.points });

    } catch (err) {
        console.error('Error completing quest:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= GET USER QUESTS =================
router.get('/', apiLimiter, verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { periode } = req.query;
        let query = 'SELECT uq.*, q.name, q.category, q.target, q.points FROM user_quests uq JOIN quest q ON uq.quest_id = q.id WHERE uq.user_id = $1';
        let params = [userId];
        if (periode) {
            query += ' AND uq.periode = $2';
            params.push(periode);
        }
        query += ' ORDER BY uq.started DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting user quests:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
