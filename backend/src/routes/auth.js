const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../auth');

// register a new user
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required!" });
    }

    try {
        // check if user exists already
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashed = hashPassword(password);
        const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashed); // store only hashed password, obviously,

        const user = { id: result.lastInsertRowid, username };
        const token = generateToken(user);

        res.status(200).json({ user, token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required!" });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!user || !comparePassword(password, user.password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = generateToken({ id: user.id, username: user.username });
        res.json({ user: { id: user.id, username: user.username }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get current info
router.get('/me', (req, res) => {
    try {
        const db = require('../db');
        const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// change password
router.post('/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password are required" });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ error: "New password must be different to the old one!" }); // idk if this one is a good idea, but ill keep it for now?
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    try {
        const db = require('../db');
        const { comparePassword, hashPassword } = require('../auth');

        // get user from db
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // verify current password
        const validPassword = comparePassword(currentPassword, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // hash new password and update in db
        const hashed = hashPassword(newPassword);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete account
router.delete('/delete', (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required to delete account" });
    }

    try { 
        const db = require('../db');
        const { comparePassword } = require('../auth');
        
        // get user from db
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // verify password
        const validPassword = comparePassword(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // delete user from db
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });

    }
});

module.exports = router;