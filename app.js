require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const Book = require('./models/books');
const userRoute = require('./routes/user');
const bookRoute = require('./routes/books');

const app = express();

// Database Connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/bookify';
mongoose
    .connect(MONGO_URL)
    .then(() => console.log('✓ MongoDB connected successfully to', MONGO_URL))
    .catch((err) => console.error('✗ MongoDB connection error:', err.message));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Core Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.resolve('./public')));
app.use(cookieParser());

// Authentication Middleware (Decodes JWT token into req.user & res.locals.user)
app.use(checkForAuthenticationCookie('token'));

// Home Route: Dashboard for authenticated users, Landing page for guests
app.get('/', async (req, res) => {
    try {
        if (!req.user) {
            // Visitor / Guest: Render modern landing page
            return res.render('home', {
                title: 'ReadStash — Your Personal Digital Bookshelf',
            });
        }

        // Authenticated User: Load personal bookshelf & stats
        const userId = req.user._id;
        const activeFilter = req.query.filter || 'all';
        const searchQuery = req.query.q ? req.query.q.trim() : '';
        const sortBy = req.query.sort || 'newest';

        // Fetch counts for reading stats
        const [totalCount, readingCount, wantCount, readCount] = await Promise.all([
            Book.countDocuments({ createdBy: userId }),
            Book.countDocuments({ createdBy: userId, status: 'reading' }),
            Book.countDocuments({ createdBy: userId, status: 'wantToRead' }),
            Book.countDocuments({ createdBy: userId, status: 'read' }),
        ]);

        const stats = {
            total: totalCount,
            reading: readingCount,
            wantToRead: wantCount,
            read: readCount,
        };

        // Build query for bookshelf
        const query = { createdBy: userId };

        if (activeFilter && activeFilter !== 'all') {
            query.status = activeFilter;
        }

        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            query.$or = [{ title: regex }, { author: regex }, { genre: regex }, { notes: regex }];
        }

        // Sorting logic
        let sortOption = { createdAt: -1 }; // default: newest
        if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sortBy === 'rating') {
            sortOption = { rating: -1, createdAt: -1 };
        } else if (sortBy === 'title') {
            sortOption = { title: 1 };
        }

        const books = await Book.find(query).sort(sortOption);

        return res.render('home', {
            title: 'My Bookshelf — ReadStash',
            books,
            stats,
            activeFilter,
            searchQuery,
            sortBy,
            welcome: req.query.welcome === 'true',
        });
    } catch (error) {
        console.error('Error loading home dashboard:', error);
        return res.render('home', {
            title: 'ReadStash — Your Personal Digital Bookshelf',
            books: [],
            stats: { total: 0, reading: 0, wantToRead: 0, read: 0 },
            activeFilter: 'all',
            searchQuery: '',
            sortBy: 'newest',
            welcome: false,
        });
    }
});

// Mounted Routes
app.use('/user', userRoute);
app.use('/books', bookRoute);

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: 'Page Not Found — ReadStash',
        message: 'The page you requested could not be found.',
    });
});

// Server Initialization
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 ReadStash server running on http://localhost:${PORT}`);
});