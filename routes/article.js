const express = require('express');
const { body, validationResult } = require('express-validator');

const db = require('../lib/database');
const { verifyToken } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/limiter.middleware');

const router = express.Router();

// ================= GET ALL PUBLISHED ARTICLES (Public Readable) =================
router.get('/', apiLimiter, async (req, res) => {
    try {
        // Pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const offset = (page - 1) * limit;

        const result = await db.query(`
            SELECT id, author_id, title, content, status, created_at, updated_at
            FROM articles
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, ['published', limit, offset]);

        const countResult = await db.query(
            'SELECT COUNT(*) as total FROM articles WHERE status = $1',
            ['published']
        );

        res.json({
            articles: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].total),
                pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
            }
        });

    } catch (err) {
        console.error('Get articles error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= GET SINGLE ARTICLE =================
router.get('/:id', apiLimiter, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM articles WHERE id = $1 AND status = $2',
            [req.params.id, 'published']
        );

        const article = result.rows[0];
        if (!article) {
            return res.status(404).json({ error: 'No article found.' });
        }

        res.json(article);

    } catch (err) {
        console.error('Get article error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= CREATE ARTICLE =================
router.post('/', [apiLimiter, verifyToken], [
    body('title').notEmpty().withMessage('Title wajib diisi'),
    body('content').isLength({ min: 10 }).withMessage('Content minimal 10 karakter')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content } = req.body;
        const author_id = req.user.id;

        const result = await db.query(
            'INSERT INTO articles (author_id, title, content, status) VALUES ($1, $2, $3, $4) RETURNING id, title',
            [author_id, title, content, 'draft']
        );

        res.status(201).json({
            message: 'Article created successfully',
            article: result.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ganti judul sana!!!' });
        }
        console.error('Create article error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ================= UPDATE ARTICLE (Author Only) =================
router.patch('/:id', [apiLimiter, verifyToken], [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional(),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid Status')
], async (req, res) => {
    try {
        const articleResult = await db.query(
            'SELECT * FROM articles WHERE id = $1',
            [req.params.id]
        );

        const article = articleResult.rows[0];
        if (!article) {
            return res.status(404).json({ error: 'No article found.' });
        }

        if (article.author_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, status } = req.body;

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(title);
        }
        if (content !== undefined) {
            updates.push(`content = $${paramIndex++}`);
            values.push(content);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (status !== undefined) {
            updates.push(`updated_at = CURRENT_TIMESTAMP`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields found to update dude.' });
        }

        values.push(parseInt(req.params.id));
        const query = `UPDATE articles SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const updateResult = await db.query(query, values);

        res.json({
            message: 'Article updated successfully',
            article: updateResult.rows[0]
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ganti judul sana!!!' });
        }
        console.error('Update article error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ================= DELETE ARTICLE (Author Only) =================
router.delete('/:id', [apiLimiter, verifyToken], async (req, res) => {
    try {
        const articleResult = await db.query(
            'SELECT * FROM articles WHERE id = $1',
            [req.params.id]
        );

        const article = articleResult.rows[0];
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        if (article.author_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const deleteResult = await db.query(
            'DELETE FROM articles WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        res.json({ message: 'Article deleted permanently' });

    } catch (err) {
        console.error('Delete article error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ================= GET MY ARTICLES =================
router.get('/me', [apiLimiter, verifyToken], async (req, res) => {
    try {
        const authorId = req.user.id;

        const result = await db.query(`
            SELECT * FROM articles 
            WHERE author_id = $1 
            ORDER BY created_at DESC
        `, [authorId]);

        res.json({
            articles: result.rows,
            count: result.rowCount
        });

    } catch (err) {
        console.error('Get my articles error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
