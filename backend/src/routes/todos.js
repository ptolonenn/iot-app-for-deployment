const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// all todo routes require authentication
router.use(authenticateToken);

// get all todos for logged in user
router.get('/', (req, res) => {
    const userId = req.user.id;
    try {
        const todos = db.prepare(`
            SELECT * FROM todos
            WHERE user_id = ?
            ORDER BY created_at DESC
        `).all(userId);
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// create todo, fixed bug: now it saves duration and due date
router.post('/', (req, res) => {
    const userId = req.user?.id;
    const { task, duration, due_date } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "No user ID" });
    }

    if (!task) {
        return res.status(400).json({ error: "Task is required" });
    }

    if (!duration) {
        return res.status(400).json({ error: "Duration is required" });
    }

    if (!due_date) {
        return res.status(400).json({ error: "Due date is required" });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO todos (user_id, task, duration, due_date) 
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(userId, task, duration, due_date);
        const newTodo = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(result.lastInsertRowid);

        res.status(201).json(newTodo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create todo" });
    }
});

/*

// update todo
router.put('/:id', (req, res) => {
    const userId = req.user?.id;
    const todoId = parseInt(req.params.id);
    const { task, duration, due_date, completed, notes, mode, time_actual_duration, time_completed_at } = req.body;

    if (!userId) {
        return res.status(401).json({ error: "No user ID" });
    }

    try {
        // First check if todo belongs to user
        const todo = db.prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`).get(todoId, userId);
        
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }

        // Build the update query dynamically based on provided fields
        const updates = [];
        const values = [];

        if (task !== undefined) {
            updates.push('task = ?');
            values.push(task);
        }
        if (duration !== undefined) {
            updates.push('duration = ?');
            values.push(duration);
        }
        if (due_date !== undefined) {
            updates.push('due_date = ?');
            values.push(due_date);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (mode !== undefined) {
            updates.push('mode = ?');
            values.push(mode);
        }
        if (time_actual_duration !== undefined) {
            updates.push('time_actual_duration = ?');
            values.push(time_actual_duration);
        }
        if (time_completed_at !== undefined) {
            updates.push('time_completed_at = ?');
            values.push(time_completed_at);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        values.push(todoId);
        values.push(userId);

        const sql = `UPDATE todos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
        const stmt = db.prepare(sql);
        stmt.run(...values);

        // Get updated todo
        const updatedTodo = db.prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`).get(todoId, userId);
        
        res.json(updatedTodo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update todo" });
    }
});


*/

// update todo - handles all fields including notes, mode, analytics
router.put('/:id', (req, res) => {
    const userId = req.user.id;
    const todoId = req.params.id;
    const { task, completed, duration, due_date, notes, mode, time_actual_duration, time_completed_at } = req.body;  
    try {
        // verify ownership
        const todo = db.prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`).get(todoId, userId);
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }

        let updateQuery = 'UPDATE todos SET ';
        const updates = [];
        const values = [];

        if (task !== undefined) {
            updates.push('task = ?');
            values.push(task);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }
        if (duration !== undefined) { 
            updates.push('duration = ?');
            values.push(duration);
        }
        if (due_date !== undefined) { 
            updates.push('due_date = ?');
            values.push(due_date);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (mode !== undefined) {
            updates.push('mode = ?');
            values.push(mode);
        }
        if (time_actual_duration !== undefined) {
            updates.push('time_actual_duration = ?');
            values.push(time_actual_duration);
        }
        if (time_completed_at !== undefined) {
            updates.push('time_completed_at = ?');
            values.push(time_completed_at);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
        values.push(todoId, userId);

        db.prepare(updateQuery).run(...values);

        const updatedTodo = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(todoId);
        res.json(updatedTodo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update todo" });
    }
});

*/

// update todo
// update todo
router.put('/:id', (req, res) => {
    const userId = req.user.id;
    const todoId = req.params.id;
    const { task, completed, duration, due_date } = req.body;  
    try {
        // verify ownership
        const todo = db.prepare(`SELECT * FROM todos WHERE id = ? AND user_id = ?`).get(todoId, userId);
        if (!todo) {
            return res.status(404).json({ error: "Todo not found" });
        }

        let updateQuery = 'UPDATE todos SET ';
        const updates = [];
        const values = [];

        if (task !== undefined) {
            updates.push('task = ?');
            values.push(task);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }
        if (duration !== undefined) { 
            updates.push('duration = ?');
            values.push(duration);
        }
        if (due_date !== undefined) { 
            updates.push('due_date = ?');
            values.push(due_date);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }

        updateQuery += updates.join(', ') + ' WHERE id = ? AND user_id = ?';
        values.push(todoId, userId);

        db.prepare(updateQuery).run(...values);

        const updatedTodo = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(todoId);
        res.json(updatedTodo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update todo" });
    }
});

// delete a todo
router.delete('/:id', (req, res) => {
    const userId = req.user.id;
    const todoId = req.params.id;

    try {
        const result = db.prepare(`DELETE FROM todos WHERE id = ? AND user_id = ?`).run(todoId, userId);
        if (result.changes === 0) {
            return res.status(404).json({ error: "Todo not found" });
        }
        res.json({ message: "Todo deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete todo" });
    }
});

// Get analytics for completed todos (last N days)
router.get('/analytics/summary', (req, res) => {
    const userId = req.user.id;
    const daysBack = parseInt(req.query.days) || 7;
    
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        const cutoffISO = cutoffDate.toISOString();

        // Get all completed sessions in the period
        const sessions = db.prepare(`
            SELECT 
                id,
                task,
                duration,
                time_actual_duration,
                time_completed_at,
                mode,
                notes
            FROM todos
            WHERE user_id = ? 
            AND completed = 1
            AND time_completed_at >= ?
            ORDER BY time_completed_at DESC
        `).all(userId, cutoffISO);

        if (!sessions.length) {
            return res.json({
                totalSessions: 0,
                totalMinutes: 0,
                avgMinutes: 0,
                modeBreakdown: {},
                sessions: []
            });
        }

        const totalMinutes = sessions.reduce((sum, s) => sum + (s.time_actual_duration || 0), 0);
        const avgMinutes = Math.round(totalMinutes / sessions.length);

        const modeBreakdown = sessions.reduce((acc, session) => {
            const mode = session.mode || 'timer';
            acc[mode] = (acc[mode] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalSessions: sessions.length,
            totalMinutes,
            avgMinutes,
            modeBreakdown,
            daysBack,
            sessions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

module.exports = router;