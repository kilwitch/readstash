const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/books');
const { requireAuth } = require('../middlewares/authentication');

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.resolve('./public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `cover-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|avif|svg/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
        return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, AVIF, SVG) are allowed!'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter,
});

// GET /books/add - Render Add Book Form
router.get('/add', requireAuth, (req, res) => {
    return res.render('books/add', {
        title: 'Add New Book — ReadStash',
        error: null,
        book: {},
    });
});

// POST /books/add - Create a new book entry
router.post('/add', requireAuth, upload.single('coverImage'), async (req, res) => {
    try {
        const { title, author, genre, status, rating, notes, favoriteQuote, totalPages, currentPage, customCoverURL } = req.body;

        if (!title || !author) {
            return res.render('books/add', {
                title: 'Add New Book — ReadStash',
                error: 'Please provide both title and author.',
                book: req.body,
            });
        }

        let coverImageURL = '/images/book.png';
        if (req.file) {
            coverImageURL = `/uploads/${req.file.filename}`;
        } else if (customCoverURL && customCoverURL.trim()) {
            coverImageURL = customCoverURL.trim();
        }

        const newBook = await Book.create({
            title: title.trim(),
            author: author.trim(),
            genre: (genre && genre.trim()) || 'General',
            status: ['wantToRead', 'reading', 'read'].includes(status) ? status : 'wantToRead',
            rating: Number(rating) || 0,
            notes: notes ? notes.trim() : '',
            favoriteQuote: favoriteQuote ? favoriteQuote.trim() : '',
            totalPages: Math.max(0, parseInt(totalPages, 10) || 0),
            currentPage: Math.max(0, parseInt(currentPage, 10) || 0),
            coverImageURL,
            createdBy: req.user._id,
        });

        return res.redirect(`/books/${newBook._id}`);
    } catch (error) {
        console.error('Error creating book:', error);
        return res.render('books/add', {
            title: 'Add New Book — ReadStash',
            error: error.message || 'Error saving book. Please try again.',
            book: req.body,
        });
    }
});

// GET /books/:id - View single book details
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.id || req.params.id, createdBy: req.user._id });
        if (!book) {
            return res.status(404).render('404', {
                title: 'Book Not Found — ReadStash',
                message: 'The requested book could not be found on your bookshelf.',
            });
        }

        return res.render('books/view', {
            title: `${book.title} — ReadStash`,
            book,
        });
    } catch (error) {
        return res.redirect('/?error=' + encodeURIComponent('Invalid book identifier'));
    }
});

// GET /books/edit/:id - Render edit form
router.get('/edit/:id', requireAuth, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!book) {
            return res.status(404).render('404', {
                title: 'Book Not Found',
                message: 'Book not found or you do not have permission to edit it.',
            });
        }

        return res.render('books/edit', {
            title: `Edit: ${book.title} — ReadStash`,
            book,
            error: null,
        });
    } catch (error) {
        return res.redirect('/');
    }
});

// POST /books/edit/:id - Update book
router.post('/edit/:id', requireAuth, upload.single('coverImage'), async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id, createdBy: req.user._id });
        if (!book) {
            return res.status(404).render('404', {
                title: 'Book Not Found',
                message: 'Book not found or permission denied.',
            });
        }

        const { title, author, genre, status, rating, notes, favoriteQuote, totalPages, currentPage, customCoverURL } = req.body;

        if (!title || !author) {
            return res.render('books/edit', {
                title: `Edit: ${book.title} — ReadStash`,
                book: { ...book.toObject(), ...req.body },
                error: 'Title and author cannot be empty.',
            });
        }

        book.title = title.trim();
        book.author = author.trim();
        book.genre = (genre && genre.trim()) || 'General';
        book.status = ['wantToRead', 'reading', 'read'].includes(status) ? status : book.status;
        book.rating = Number(rating) || 0;
        book.notes = notes ? notes.trim() : '';
        book.favoriteQuote = favoriteQuote ? favoriteQuote.trim() : '';
        book.totalPages = Math.max(0, parseInt(totalPages, 10) || 0);
        book.currentPage = Math.max(0, parseInt(currentPage, 10) || 0);

        if (req.file) {
            book.coverImageURL = `/uploads/${req.file.filename}`;
        } else if (customCoverURL && customCoverURL.trim()) {
            book.coverImageURL = customCoverURL.trim();
        }

        await book.save();
        return res.redirect(`/books/${book._id}`);
    } catch (error) {
        console.error('Error updating book:', error);
        return res.redirect(`/books/${req.params.id}`);
    }
});

// POST /books/status/:id - Quick update reading status
router.post('/status/:id', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        if (['wantToRead', 'reading', 'read'].includes(status)) {
            await Book.findOneAndUpdate(
                { _id: req.params.id, createdBy: req.user._id },
                { status }
            );
        }
        const backURL = req.header('Referer') || '/';
        return res.redirect(backURL);
    } catch (error) {
        return res.redirect('/');
    }
});

// POST /books/delete/:id - Delete book
router.post('/delete/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await Book.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
        return res.redirect('/?deleted=true');
    } catch (error) {
        return res.redirect('/?error=' + encodeURIComponent('Could not delete book.'));
    }
});

module.exports = router;
