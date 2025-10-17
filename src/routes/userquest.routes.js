import express from 'express';
const router = express.Router();
import db from '../db.js';
import { getISOWeek, getYear } from 'date-fns';

function isValidDaily(periode) {
    const today = new Date().toISOString().slice(0, 10);
    return periode === today;
}
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
        // Cek quest sudah dijalankan
        const check = db.prepare('SELECT * FROM user_quests WHERE user_id = ? AND quest_id = ? AND periode = ?');
        const ada = check.get(user_id, quest_id, periode);
        if (ada) {
            return res.status(409).json({ error: 'Quest sudah dijalankan di periode ini' });
        }
        const insert = db.prepare('INSERT INTO user_quests (user_id, quest_id, periode) VALUES (?, ?, ?)');
        const hasil = insert.run(user_id, quest_id, periode);
        res.status(201).json({
            id: hasil.lastInsertRowid,
            user_id,
            quest_id,
            periode,
            progress: 0,
            completed: 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Unknown error' });
    }
});

router.patch('/:id/progress', ensureOwnership, (req, res) => {
    try {
        const { id } = req.params;
        const increment = req.body.increment !== undefined ? Number(req.body.increment) : 1;
        if (isNaN(increment) || increment <= 0) {
            return res.status(400).json({ error: 'Increment harus angka positif' });
        }
        // Ambil progress, quest_id, completed, periode dari req.userQuest
        const userQuest = req.userQuest;
        if (userQuest.completed) {
            return res.status(400).json({ error: 'Quest sudah complete' });
        }
        // Ambil target, deadline, category dari quest
        const questStmt = db.prepare('SELECT target, deadline, category FROM quest WHERE id = ?');
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
        let newProgress = userQuest.progress + increment;
        let completed = 0;
        let finished = null;
        if (newProgress >= quest.target) {
            newProgress = quest.target;
            completed = 1;
            finished = new Date().toISOString();
        }
        const updateStmt = db.prepare('UPDATE user_quests SET progress = ?, completed = ?, finished = ? WHERE id = ?');
        updateStmt.run(newProgress, completed, finished, id);
        res.json({
            message: completed ? 'Quest completed!' : 'Progress updated',
            progress: newProgress,
            completed: !!completed
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/complete', ensureOwnership, (req, res) => {
    try {
        const { id } = req.params;
        const userQuest = req.userQuest;
        // Ambil kategori, deadline dari quest
        const questStmt = db.prepare('SELECT category, deadline FROM quest WHERE id = ?');
        const quest = questStmt.get(userQuest.quest_id);
        if (!quest) {
            return res.status(404).json({ error: 'Quest definition not found' });
        }
        // Validasi deadline
        if (quest.deadline && new Date() > new Date(quest.deadline)) {
            return res.status(400).json({ error: 'Quest sudah lewat deadline, tidak bisa complete.' });
        }
        // Validasi periode sesuai kategori
        if (quest.category === 'daily' && !isValidDaily(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode daily hanya boleh hari ini.' });
        }
        if (quest.category === 'weekly' && !isValidWeekly(userQuest.periode)) {
            return res.status(400).json({ error: 'Periode weekly hanya boleh minggu ini.' });
        }
        const finish = new Date().toISOString();
        const checkcheck = db.prepare('UPDATE user_quests SET completed = 1, finished = ? WHERE id = ?');
        const hasilhasil = checkcheck.run(finish, id);
        if (hasilhasil.changes === 0) {
            return res.status(404).json({ error: 'gak ada, lu gk start ini kali' });
        }
        res.json({ message: 'Quest marked as completed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', (req, res) => {
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
});

export default router;
