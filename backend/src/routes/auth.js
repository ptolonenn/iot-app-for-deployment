const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePassword, generateToken } = require('../auth');
const { authenticateToken } = require('../middleware/auth');

// register a new user
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required!" });
    }

    db.get('SELECT id FROM users WHERE username = ?', [username], (err, existing) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
        
        if (existing) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashed = hashPassword(password);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Server error" });
            }
            
            const user = { id: this.lastID, username };
            const token = generateToken(user);
            res.status(200).json({ user, token });
        });
    });
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required!" });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
        
        if (!user || !comparePassword(password, user.password)) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = generateToken({ id: user.id, username: user.username });
        res.json({ user: { id: user.id, username: user.username }, token });
    });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json(user);
    });
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPassword = comparePassword(currentPassword, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = hashPassword(newPassword);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Server error" });
            }
            
            res.json({ message: "Password changed successfully" });
        });
    });
});

// Delete account
router.delete('/delete-account', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required to delete account" });
    }

    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Server error" });
        }
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const validPassword = comparePassword(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: "Password is incorrect" });
        }

        // Delete user's todos
        db.run('DELETE FROM todos WHERE user_id = ?', [userId], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Server error" });
            }
            
            // Delete user
            db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Server error" });
                }
                
                res.json({ message: "Account deleted successfully" });
            });
        });
    });
});

module.exports = router;
