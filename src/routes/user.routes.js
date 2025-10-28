import express from 'express';
import db from "../db.js";

const router = express.Router();

router.get('/me', (req, res) => {
    try {
        const user_id = req.user.id;
        const user_statement = db.prepare('SELECT id, username, email, points FROM users WHERE id = ?');
        const user = user_statement.get(user_id);

        if (!user) return res.status(404).json({ error: 'User not found.' });

        const statsStatement = db.prepare(`
            SELECT
                COUNT(*) as total_quests,
                COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_quests,
                SUM(CASE WHEN completed = 1 THEN progress ELSE 0 END) as total_progress
            FROM user_quests
            WHERE user_id = ?
        `);
        const stats = statsStatement.get(user_id);

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                points: user.points || 0
            },
            stats: {
                total_quests: stats.total_quests || 0,
                completed_quests: stats.completed_quests || 0,
                total_progress: stats.total_progress || 0
            }
        });

    } catch (err) {
        console.error('Error getting user profile', err);
        res.status(500).json({ error: err.message });
    }
});



// DEBUG ENDPOINT - Cek data raw dari database
// router.get('/me/debug', (req, res) => {
//     try {
//         const user_id = req.user.id;
//
//         // Raw query untuk cek data
//         const rawStmt = db.prepare('SELECT id, quest_id, progress, completed FROM user_quests WHERE user_id = ? ORDER BY id DESC LIMIT 5');
//         const rawQuests = rawStmt.all(user_id);
//
//         // Stats query
//         const statsStmt = db.prepare(`
//       SELECT
//         COUNT(*) as total_quests,
//         COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_quests,
//         SUM(CASE WHEN completed = 1 THEN progress ELSE 0 END) as total_progress
//       FROM user_quests
//       WHERE user_id = ?
//     `);
//         const stats = statsStmt.get(user_id);
//
//         res.json({
//             user_id,
//             raw_quests: rawQuests,
//             stats: stats
//         });
//
//     } catch (err) {
//         console.error('Error debug:', err);
//         res.status(500).json({ error: err.message });
//     }
// });

export default router;