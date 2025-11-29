const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../lib/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/limiter.middleware');

const router = express.Router();

// ================= GET ALL QUESTS =================
router.get('/', apiLimiter, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT id, name, description, category, points, target, created, deadline
      FROM quest
      ORDER BY created DESC
    `);

        res.json(result.rows);
    } catch (err) {
        console.error('Get quests error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


// ================= GET SINGLE QUEST =================
router.get('/:id', apiLimiter, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query(
            'SELECT id, name, description, category, points, target, created, deadline FROM quest WHERE id = $1', [id]
        );
        const quest = result.rows[0];
        if (!quest) return res.status(404).json({ error: 'Quest Not Found' });
        res.json(quest);

    } catch (err) {
        console.error('Get quest error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= CREATE QUEST (ADMIN ONLY) =================
router.post('/', [apiLimiter, verifyToken], [
    body('name').notEmpty().withMessage('Name wajib diisi'),
    body('category').isIn(['daily', 'weekly']).withMessage('Category harus daily/weekly'),
    body('points').isInt({ min: 0 }).withMessage('Points harus angka >= 0'),
    body('target').isInt({ min: 1 }).withMessage('Target harus angka >= 1'),
    body('deadline').optional().isISO8601().withMessage('Deadline format ISO')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, points, category, deadline, target } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO quest (name, description, points, category, deadline, target, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, true) 
             RETURNING id, name, description, points, category, deadline, target, created`,
            [name, description || null, points, category, deadline, target]
        );

        res.status(201).json({ message: 'Quest created successfully', quest: result.rows[0] });

    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Quest name sudah ada' });
        console.error('Create quest error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= UPDATE QUEST (ADMIN ONLY) =================
router.patch('/:id', [apiLimiter, verifyToken], async (req, res) => {
    const { id } = req.params;
    const { name, description, points, category, deadline, target } = req.body;

    if (category && !['daily', 'weekly'].includes(category)) return res.status(400).json({ error: 'Invalid category' });
    if (target !== undefined && (typeof target !== 'number' || target <= 0)) return res.status(400).json({ error: 'Target harus angka positif' });

    try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        if (points !== undefined) {
            updates.push(`points = $${paramIndex++}`);
            values.push(points);
        }
        if (category !== undefined) {
            updates.push(`category = $${paramIndex++}`);
            values.push(category);
        }
        if (deadline !== undefined) {
            updates.push(`deadline = $${paramIndex++}`);
            values.push(deadline);
        }
        if (target !== undefined) {
            updates.push(`target = $${paramIndex++}`);
            values.push(target);
        }

        if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

        values.push(parseInt(id));
        const query = `UPDATE quest SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const result = await db.query(query, values);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Quest not found' });
        res.json({message: 'Quest updated successfully', quest: result.rows[0]});

    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Quest name sudah ada' });
        console.error('Update quest error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= DELETE QUEST (ADMIN ONLY) =================
router.delete('/:id', [apiLimiter, verifyToken], async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query('DELETE FROM quest WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Quest Not Found' });
        res.status(200).json({message: 'Quest deleted successfully', deletedId: result.rows[0].id});

    } catch (err) {
        console.error('Delete quest error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
