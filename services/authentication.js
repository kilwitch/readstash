// Create and validate JWT tokens
require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.SECRET || 'ReadStashSuperSecretKey2026';

function createTokenForUser(user) {
    const payload = {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImageURL: user.profileImageURL || '/images/avatar.png',
        role: user.role || 'USER',
    };
    const token = jwt.sign(payload, secret, { expiresIn: '7d' });
    return token;
}

function validateToken(token) {
    if (!token) return null;
    const payload = jwt.verify(token, secret);
    return payload;
}

module.exports = {
    createTokenForUser,
    validateToken,
};