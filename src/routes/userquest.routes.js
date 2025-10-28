import express from 'express';
import db from '../db.js';
import { getISOWeek, getYear } from 'date-fns';

const router = express.Router();

// Helper: validasi periode daily
function isValidDaily(periode) {
    const today = new Date().toISOString().slice(0, 10);
    return periode === today;
}

// Helper: validasi periode weekly
function isValidWeekly(periode) {
    const now = new Date();
    const currentWeek = `${getYear(now)}-W${getISOWeek(now)}`;
    return periode === currentWeek;
}

// Helper: validasi kepemilikan data user_quests
function ensureOwnership(req, res, next) {
    const user_id = req.user.id;
    const { id } = req.params;

    const userQuest = db.prepare('SELECT * FROM user_quests WHERE id = ?').get(id);

    if (!userQuest) {
        return res.status(404).json({ error: 'User quest not found' });
    }

    if (userQuest.user_id !== user_id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    req.userQuest = userQuest; // simpan untuk handler berikutnya
    next();
}

router.post('/start', (req, res) => {
    try {
        const user_id = req.user.id;
        let { quest_id, periode } = req.body;
        if (!user_id || !quest_id || !periode) {
            return res.status(400).json({ error: 'user_id, quest_id, and periode are required' });
        }
        // Ambil kategori quest
        const questStmt = db.prepare('SELECT category FROM quest WHERE id = ?');
        const quest = questStmt.get(quest_id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest definition not found' });
        }
        // Validasi periode sesuai kategori
        if (quest.category === 'daily' && !isValidDaily(periode)) {
            return res.status(400).json({ error: 'Periode daily hanya boleh hari ini.' });
        }
        if (quest.category === 'weekly' && !isValidWeekly(periode)) {
            return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini.' });
        }

        // Cek quest sudah dijalankan di periode yang sama
        const check = db.prepare('SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ? AND periode = ?');
        const ada = check.get(user_id, quest_id, periode);
        if (ada) {
            return res.status(409).json({ error: 'Quest sudah dijalankan di periode ini' });
        }

        // Insert user quest baru
        const insert = db.prepare('INSERT INTO user_quests (user_id, quest_id, periode) VALUES (?, ?, ?)');
        const hasil = insert.run(user_id, quest_id, periode);
        res.status(201).json({
            id: hasil.lastInsertRowid,
            user_id,
            quest_id,
            periode,
            progress: 0,
            completed: 0,
            started: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error starting quest:', err);
        res.status(500).json({ error: err.message || 'Unknown error' });
    }
});

router.patch('/:id/progress', ensureOwnership, (req, res) => {
    try {
        const { id } = req.params;
        const increment = req.body.increment !== undefined ? Number(req.body.increment) : 1;
        // Validasi increment harus angka positif
        if (isNaN(increment) || increment <= 0) {
            return res.status(400).json({ error: 'Increment harus angka positif' });
        }

        const userQuest = req.userQuest;

        // Cek apakah quest sudah completed
        if (userQuest.completed) {
            return res.status(400).json({ error: 'Quest sudah complete' });
        }

        const questStmt = db.prepare('SELECT target, deadline, category, points FROM quest WHERE id = ?');
        const quest = questStmt.get(userQuest.quest_id);

        if (!quest) {
            return res.status(404).json({ error: 'Quest definition not found' });
        }

        // Validasi deadline
        if (quest.deadline && new Date() > new Date(quest.deadline)) {
            return res.status(400).json({ error: 'Quest sudah lewat deadline, tidak bisa progress.' });
        }

        // Validasi periode sesuai kategori
        if (quest.category === 'daily' && !isValidDaily(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode daily hanya boleh hari ini.' });
        }

        if (quest.category === 'weekly' && !isValidWeekly(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini.' });
        }

        // Hitung progress baru
        let newProgress = userQuest.progress + increment;
        let completed = 0;
        let finished = null;
        let pointsEarned = 0;

        if (newProgress >= quest.target) {
            newProgress = quest.target; // Cap di target maksimal
            completed = 1;
            finished = new Date().toISOString();
            pointsEarned = quest.points;

            const updateUserPoints = db.prepare('UPDATE users SET points = points + ? WHERE id = ?');
            updateUserPoints.run(quest.points, userQuest.user_id);

            console.log(`✅ User ${userQuest.user_id} completed quest ${userQuest.quest_id}, earned ${quest.points} points`);
        }

        // Update progress di user_quests
        const updateStmt = db.prepare('UPDATE user_quests SET progress = ?, completed = ?, finished = ? WHERE id = ?');
        updateStmt.run(newProgress, completed, finished, id);

        res.json({
            message: completed ? '🎉 Quest completed! Points awarded!' : 'Progress updated',
            progress: newProgress,
            target: quest.target,
            completed: !!completed,
            points_earned: pointsEarned,
            finished: finished
        });

    } catch (err) {
        console.error('Error updating progress:', err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/complete', ensureOwnership, (req, res) => {
    try {
        const { id } = req.params;
        const userQuest = req.userQuest;

        const questStmt = db.prepare('SELECT category, deadline, points FROM quest WHERE id = ?');
        const quest = questStmt.get(userQuest.quest_id);

        if (!quest) {
            return res.status(404).json({ error: 'Quest definition not found' });
        }

        if (quest.deadline && new Date() > new Date(quest.deadline)) {
            return res.status(400).json({ error: 'Quest sudah lewat deadline, tidak bisa complete.' });
        }

        if (quest.category === 'daily' && !isValidDaily(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode daily hanya boleh hari ini.' });
        }
        if (quest.category === 'weekly' && !isValidWeekly(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini.' });
        }

        const finish = new Date().toISOString();

        const updateUserPoints = db.prepare('UPDATE users SET points = points + ? WHERE id = ?');
        updateUserPoints.run(quest.points, userQuest.user_id);

        // Mark quest as completed
        const updateQuest = db.prepare('UPDATE user_quests SET completed = 1, finished = ? WHERE id = ?');
        const hasil = updateQuest.run(finish, id);

        if (hasil.changes === 0) {
            return res.status(404).json({ error: 'Quest tidak ditemukan atau sudah complete' });
        }

        console.log(`User ${userQuest.user_id} manually completed quest ${userQuest.quest_id}, earned ${quest.points} points`);

        res.json({
            message: 'Quest marked as completed! Points awarded!',
            points_earned: quest.points
        });

    } catch (err) {
        console.error('Error completing quest:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', (req, res) => {
    try {
        const user_id = req.user.id;
        const { periode } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        let query = 'SELECT * FROM user_quests WHERE user_id = ?';
        let params = [user_id];

        if (periode) {
            query += ' AND periode = ?';
            params.push(periode);
        }

        const stmt = db.prepare(query);
        const quests = stmt.all(...params);

        res.json(quests);

    } catch (err) {
        console.error('Error getting user quests:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
