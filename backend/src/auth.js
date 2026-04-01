const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// password hashing
function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

// compare password with hash
function comparePassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

// generate jwt token
function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: '7D',
    });
}

// verify jwt token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
};