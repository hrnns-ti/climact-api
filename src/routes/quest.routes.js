import express from 'express';
import db from "../db.js";
const router = express.Router();


router.get('/', (req, res) => {
    const statement = db.prepare('SELECT * FROM quest');
    const quests = statement.all();
    res.json(quests);
})

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const statementQuest = db.prepare('SELECT * FROM quest WHERE id = ?');
    const quest = statementQuest.get(id);
    if (!quest) { return res.status(404).json({ error: 'Quest Not Found' }); }
    res.json(quest);
})


router.post('/', (req, res) => {
    const { name, description, points, category, deadline } = req.body;
    if (!['daily', 'weekly'].includes(category)) { return res.status(400).send('Invalid category'); }
    const statementAdmin = db.prepare('INSERT INTO quest (name, description, points, category, deadline) VALUES (?,?,?,?,?) ')
    try {
        const result = statementAdmin.run(name, description, points, category, deadline);
        res.status(201).json({ id: result.lastInsertRowid, name, description, points, category, deadline });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description, points, category, deadline } = req.body;
    if (category && !['daily', 'weekly'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }

    const fields = [];
    const values = [];

    if (name) { fields.push('name = ?'); values.push(name); }
    if (description) { fields.push('description = ?'); values.push(description); }
    if (points !== undefined) { fields.push('points = ?'); values.push(points); }
    if (category) { fields.push('category = ?'); values.push(category); }
    if (deadline) { fields.push('deadline = ?'); values.push(deadline); }
    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const statementEdit = db.prepare(`UPDATE quest SET ${fields.join(', ')} WHERE id = ?`);
    const result = statementEdit.run(...values);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Quest not found' });
    }
    res.json({ message: 'Quest updated' });
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const statementDelete = db.prepare('DELETE FROM quest WHERE id = ?');
    const deleted = statementDelete.run(id);
    if (!deleted) { return res.status(404).json({ error: 'Quest Not Found' }); }
    res.status(200).json({ message: 'Quest Deleted' });
})

export default router;