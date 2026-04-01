require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // to ensure that tables are created
const path = require('path');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*', // frontend - deploying, so no more localhost
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../frontend/dist'); // will this work? idk 
    app.use(express.static(frontendPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));

    });
    console.log(`Serving frontend from: ${frontendPath}`);
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

});
