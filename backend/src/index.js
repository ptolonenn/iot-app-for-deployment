require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // to ensure that tables are created

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:5173', // frontend
    credentials: true, // allow cookies if needed
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});