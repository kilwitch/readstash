const { Schema, model } = require('mongoose');

const BookSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Book title is required'],
            trim: true,
        },
        author: {
            type: String,
            required: [true, 'Author name is required'],
            trim: true,
        },
        genre: {
            type: String,
            trim: true,
            default: 'General',
        },
        notes: {
            type: String,
            default: '',
        },
        favoriteQuote: {
            type: String,
            default: '',
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        },
        status: {
            type: String,
            enum: ['wantToRead', 'reading', 'read'],
            default: 'wantToRead',
        },
        totalPages: {
            type: Number,
            default: 0,
            min: 0,
        },
        currentPage: {
            type: Number,
            default: 0,
            min: 0,
        },
        coverImageURL: {
            type: String,
            default: '/images/book.png',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
    },
    { timestamps: true }
);

const Book = model('book', BookSchema);
module.exports = Book;