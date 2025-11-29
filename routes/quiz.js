// routes/quizzes.js - DAILY QUIZ SYSTEM
const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../lib/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/limiter.middleware');

const router = express.Router();

// ================= GET TODAY'S DAILY QUIZ =================
router.get('/daily', [apiLimiter, verifyToken], async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const result = await db.query(`
      SELECT 
        q.id AS question_id,
        q.question_text,
        json_agg(
          json_build_object(
            'choice_id', c.id,
            'choice_text', c.choice_text
          )
          ORDER BY c.id
        ) AS choices
      FROM quiz_questions q
      LEFT JOIN quiz_choices c ON q.id = c.question_id
      GROUP BY q.id
      ORDER BY random()
      LIMIT 5
    `);

        const questions = result.rows.map(q => ({
            id: q.question_id,
            question_text: q.question_text,
            choices: q.choices
        }));

        if (questions.length === 0) {
            return res.status(404).json({ error: 'No quiz questions available' });
        }

        res.json({
            quiz: questions,
            date: today,
            questions_count: questions.length
        });
    } catch (err) {
        console.error('Get daily quiz error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ================= SUBMIT DAILY QUIZ ANSWERS =================
router.post('/daily/submit', [apiLimiter, verifyToken], [
    body('answers').isArray({ min: 1, max: 5 }).withMessage('Answers must be 1-5 questions'),
    body('answers.*.question_id').isInt({ min: 1 }).withMessage('Invalid question ID'),
    body('answers.*.selected_choice_id').isInt({ min: 1 }).withMessage('Invalid choice ID')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { answers } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    try {
        const sessionResult = await db.query(
            'SELECT id FROM quiz_sessions WHERE user_id = $1 AND date = $2',
            [userId, today]
        );

        if (sessionResult.rows.length > 0) {
            return res.status(409).json({ error: "You have already submitted today's quiz." });
        }

        await db.query('BEGIN');

        try {
            const sessionResult = await db.query(
                'INSERT INTO quiz_sessions (user_id, date, score, completed) VALUES ($1, $2, 0, true) RETURNING id',
                [userId, today]
            );
            const sessionId = sessionResult.rows[0].id;

            let score = 0;

            for (const ans of answers) {
                await db.query(
                    'INSERT INTO quiz_answers (session_id, question_id, selected_choice_id) VALUES ($1, $2, $3)',
                    [sessionId, ans.question_id, ans.selected_choice_id]
                );

                const correctResult = await db.query(
                    'SELECT id FROM quiz_choices WHERE question_id = $1 AND is_correct = true',
                    [ans.question_id]
                );

                if (correctResult.rows.length > 0 &&
                    correctResult.rows[0].id === ans.selected_choice_id) {
                    score++;
                }
            }

            await db.query(
                'UPDATE quiz_sessions SET score = $1 WHERE id = $2',
                [score, sessionId]
            );

            const pointsEarned = score * 2;
            await db.query(
                'UPDATE users SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [pointsEarned, userId]
            );

            await db.query('COMMIT');

            console.log(`User ${userId} completed daily quiz: ${score}/5 correct, ${pointsEarned} points earned`);

            res.json({
                message: 'Quiz submitted successfully.',
                score,
                total_questions: answers.length,
                pointsEarned,
                percentage: Math.round((score / answers.length) * 100)
            });

        } catch (transactionErr) {
            await db.query('ROLLBACK');
            throw transactionErr;
        }

    } catch (err) {
        console.error('Submit quiz error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
