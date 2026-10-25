const { Router } = require('express');
const User = require('../models/user');
const { createTokenForUser } = require('../services/authentication');
const { redirectIfAuthenticated } = require('../middlewares/authentication');

const router = Router();

// GET /user/signin - Sign In Page
router.get('/signin', redirectIfAuthenticated, (req, res) => {
    return res.render('signin', {
        title: 'Sign In — ReadStash',
        error: req.query.error || null,
        message: req.query.message || (req.query.registered ? 'Account created successfully! Please sign in.' : null),
        email: req.query.email || '',
    });
});

// GET /user/signup - Sign Up Page
router.get('/signup', redirectIfAuthenticated, (req, res) => {
    return res.render('signup', {
        title: 'Create Account — ReadStash',
        error: null,
        fullName: '',
        email: '',
    });
});

// POST /user/signin - Authenticate User
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await User.matchPasswordandGenerateToken(email, password);
        const token = typeof result === 'string' ? result : result.token;

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
        });

        const redirectUrl = req.query.redirect || '/';
        return res.redirect(redirectUrl);
    } catch (error) {
        return res.render('signin', {
            title: 'Sign In — ReadStash',
            error: error.message || 'Incorrect email or password.',
            message: null,
            email: email || '',
        });
    }
});

// POST /user/signup - Register User & Auto-Login
router.post('/signup', async (req, res) => {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
        return res.render('signup', {
            title: 'Create Account — ReadStash',
            error: 'All fields are required.',
            fullName: fullName || '',
            email: email || '',
        });
    }

    if (confirmPassword && password !== confirmPassword) {
        return res.render('signup', {
            title: 'Create Account — ReadStash',
            error: 'Passwords do not match.',
            fullName: fullName || '',
            email: email || '',
        });
    }

    if (password.length < 6) {
        return res.render('signup', {
            title: 'Create Account — ReadStash',
            error: 'Password must be at least 6 characters.',
            fullName: fullName || '',
            email: email || '',
        });
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.render('signup', {
                title: 'Create Account — ReadStash',
                error: 'An account with this email address already exists.',
                fullName,
                email,
            });
        }

        const newUser = await User.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            password,
        });

        // Auto login the newly created user
        const token = createTokenForUser(newUser);
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
        });

        return res.redirect('/?welcome=true');
    } catch (error) {
        return res.render('signup', {
            title: 'Create Account — ReadStash',
            error: error.message || 'Could not register user. Please try again.',
            fullName: fullName || '',
            email: email || '',
        });
    }
});

// GET /user/logout - Sign Out
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.redirect('/user/signin?message=' + encodeURIComponent('You have been logged out successfully.'));
});

module.exports = router;