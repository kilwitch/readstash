const { Schema, model } = require('mongoose');
const { randomBytes, createHmac } = require('crypto');
const { createTokenForUser } = require('../services/authentication');

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        salt: {
            type: String,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        profileImageURL: {
            type: String,
            default: '/images/avatar.png',
        },
        role: {
            type: String,
            enum: ['USER', 'ADMIN'],
            default: 'USER',
        },
    },
    { timestamps: true }
);

userSchema.pre('save', function (next) {
    const user = this;

    if (!user.isModified('password')) {
        return typeof next === 'function' ? next() : undefined;
    }

    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt).update(user.password).digest('hex');

    this.salt = salt;
    this.password = hashedPassword;

    if (typeof next === 'function') next();
});

// Static method to authenticate and generate JWT token
userSchema.static('matchPasswordandGenerateToken', async function (email, password) {
    if (!email || !password) {
        throw new Error('Please enter both email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.findOne({ email: normalizedEmail });
    if (!user) throw new Error('No account found with this email.');

    const salt = user.salt;
    const hashedPassword = user.password;

    const userProvidedHash = createHmac('sha256', salt).update(password).digest('hex');
    if (hashedPassword !== userProvidedHash) throw new Error('Incorrect password. Please try again.');

    const token = createTokenForUser(user);
    return { token, user };
});

const User = model('user', userSchema);
module.exports = User;