# ReadStash – Personal Digital Bookshelf  

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-success)](https://www.mongodb.com/)  
[![JWT](https://img.shields.io/badge/Auth-JWT-orange)](https://jwt.io/)  
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)  

**ReadStash** is a clean, full‑stack web application that lets you store, organize, and revisit your favorite books from any device. It combines a secure Express REST API, a responsive EJS dashboard, and JWT‑based stateless authentication to deliver a smooth, privacy‑first experience.

---  

## Table of Contents  

- [Demo](#demo)  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Architecture Overview](#architecture-overview)  
- [Installation & Setup](#installation--setup)  
- [Environment Variables](#environment-variables)  
- [API Endpoints](#api-endpoints)  
- [Usage Walkthrough](#usage-walkthrough)  
- [Project Structure](#project-structure)  
- [Testing & Validation](#testing--validation)  
- [Contribution Guidelines](#contribution-guidelines)  
- [License](#license)  

---  

## Demo  

" ReadStash Dashboard " 
*A live view of the authenticated dashboard showing book statistics, search & filter controls, and a responsive book grid.*  

*(Replace the above URL with an actual screenshot stored in the `assets/` folder.)*  

---  

## Features  

| ✅ | Description |
|----|-------------|
| **Secure Authentication** | Stateless JWT stored in an HttpOnly cookie; middleware decodes the token and injects `req.user` / `res.locals.user`. |
| **Full CRUD for Books** | Add, edit, delete, and view books with optional cover‑image upload (Multer). |
| **Dynamic Dashboard** | Real‑time counts (total, reading, want‑to‑read, read), keyword search, status filters, and sortable columns (newest, oldest, rating, title). |
| **Guest & User Modes** | Unauthenticated visitors see a sleek landing page; logged‑in users see their personal bookshelf. |
| **File Upload & Storage** | Cover images saved under `public/uploads/` with a fallback placeholder. |
| **Robust Validation** | Server‑side checks for required fields, MIME type whitelist, and size limits (5 MB). |
| **Error Handling** | Centralised 404 page and graceful fallback UI on server errors. |
| **Extensible Design** | Clean MVC separation makes it trivial to add pagination, rating analytics, or sharing features. |

---  

## Tech Stack  

| Layer | Technology | Reason |
|-------|------------|--------|
| **Runtime** | Node.js (v18+) | Modern JavaScript runtime with async/await support. |
| **Web Framework** | Express.js | Minimal, flexible routing & middleware pipeline. |
| **Database** | MongoDB + Mongoose | Schema‑based NoSQL storage; easy relationship via `ObjectId`. |
| **Authentication** | JSON Web Tokens (JWT) | Stateless, scalable auth without server‑side sessions. |
| **Templating** | EJS | Server‑side rendering for fast first paint; easy integration with Express. |
| **File Upload** | Multer | Handles multipart/form‑data and stores images on disk. |
| **Styling** | Vanilla CSS (with Google Fonts – *Inter*) | Keeps the project lightweight while delivering a polished UI. |
| **Version Control** | Git + GitHub | Full audit trail; sensitive files removed from history. |

---  

## Architecture Overview  

```
┌───────────────────────┐
│   Client (Browser)      │
│  - EJS rendered pages   │
│  - Forms & AJAX calls   │
└───────▲───────▲───────┘
        │       │
        │       │  HTTP (JSON / HTML)
        │       │
┌───────▼───────▼───────┐
│   Express Server      │
│  - Routes (/user, /books) │
│  - Auth middleware (JWT) │
│  - Multer for uploads     │
└───────▲───────▲───────┘
        │       │
        │       │  Mongoose ODM
        │       │
┌───────▼───────▼───────┐
│   MongoDB Database     │
│   - users collection   │
│   - books collection   │
└───────────────────────┘
```

* **Stateless JWT** – No session store; the token is verified on each request, guaranteeing scalability.  
* **Separation of Concerns** – `models/`, `routes/`, `middlewares/` keep business logic, data access, and request handling distinct.  
* **Extensible Middleware** – Authentication, error handling, and file‑upload logic are reusable across routes.  

---  

## Installation & Setup  

> **Prerequisites**  
> - Node.js (≥ 18)  
> - npm (≥ 9)  
> - MongoDB instance (local or remote)  

```bash
# 1️⃣ Clone the repository
git clone https://github.com/your-username/ReadStash.git
cd ReadStash

# 2️⃣ Install dependencies
npm install

# 3️⃣ Create a .env file (see section below)
cp .env.example .env
# Edit .env with your own values

# 4️⃣ Run the development server
npm run dev   # starts on http://localhost:8000

# 5️⃣ Open the app
# Visit http://localhost:8000 in your browser
```

*The `npm run dev` script uses `nodemon` for hot‑reloading during development.*  

---  

## Environment Variables  

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port on which Express listens | `8000` |
| `MONGO_URL` | MongoDB connection string | `mongodb://localhost:27017/readstash` |
| `JWT_SECRET` | Secret key for signing JWTs (minimum 32 characters) | `aSuperSecretKeyThatIsAtLeast32Chars!` |
| `COOKIE_NAME` | Name of the auth cookie (default `token`) | `token` |
| `NODE_ENV` | `development` or `production` | `development` |

> **Never commit** your real `.env` file. The repository contains `.env.example` with placeholder values.  

---  

## API Endpoints  

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/user/register` | ❌ | Register a new user (email + password). |
| `POST` | `/user/login`    | ❌ | Authenticate & receive JWT cookie. |
| `GET`  | `/user/logout`   | ✅ | Clear JWT cookie. |
| `GET`  | `/books`         | ✅ | Dashboard – returns filtered/sorted books (query params: `filter`, `q`, `sort`). |
| `GET`  | `/books/add`     | ✅ | Render *Add Book* form. |
| `POST` | `/books/add`     | ✅ | Create a new book (multipart/form‑data for cover image). |
| `GET`  | `/books/:id`     | ✅ | View details of a single book. |
| `GET`  | `/books/edit/:id`| ✅ | Render *Edit Book* form. |
| `POST` | `/books/edit/:id`| ✅ | Update book details (supports new cover image). |
| `POST` | `/books/status/:id`| ✅ | Quick status change (`wantToRead`, `reading`, `read`). |
| `POST` | `/books/delete/:id`| ✅ | Delete a book entry. |
| `GET`  | `/*`             | ❌ | 404 handler – renders custom page. |

*All protected routes use the `requireAuth` middleware.*  

---  

## Usage Walkthrough  

1. **Sign Up / Sign In** – Create an account; a JWT is set in an HttpOnly cookie.  
2. **Dashboard** – After login you land on `/` where the app loads your book counts and displays a grid of books.  
3. **Search & Filter** – Use the search bar (`q=`) or status dropdown (`filter=`) to narrow results; the URL updates automatically (bookmarkable).  
4. **Sort** – Choose “Newest”, “Oldest”, “Rating”, or “Title” via the sort dropdown (`sort=`).  
5. **Add a Book** – Click **Add New Book**, fill the form, optionally upload a cover image, and submit.  
6. **Edit / Delete** – From the book detail view you can edit fields or delete the entry.  
7. **Status Quick‑Change** – On the dashboard each book card includes a status button; clicking it sends a lightweight POST to `/books/status/:id`.  

---  

## Project Structure  

```
ReadStash/
│
├─ models/               # Mongoose schemas (user.js, books.js)
├─ routes/               # Express routers (user.js, books.js)
├─ middlewares/          # Auth middleware, error handling
├─ public/               # Static assets (CSS, JS, images, uploads/)
│   └─ uploads/          # Cover images uploaded by users
├─ views/                # EJS templates (home.ejs, books/*.ejs, 404.ejs)
├─ services/             # Helper utilities (e.g., password hashing)
├─ .env.example          # Sample environment file
├─ app.js                # Application entry point
├─ package.json
└─ README.md
```

---  

## Testing & Validation  

- **Manual Tests** – Verify registration/login, CRUD flows, image upload limits (≤ 5 MB), and CORS restrictions by accessing the API from another origin.  
- **Linting** – Run `npm run lint` (ESLint) to maintain code quality.  
- **Future Improvements** – Add automated Jest/Supertest suites for unit and integration testing, and enable CI pipelines (GitHub Actions) to enforce quality gates.  

---  

## Contribution Guidelines  

1. **Fork the repository** and create a feature branch (`git checkout -b feature/awesome‑feature`).  
2. **Install dependencies** (`npm install`).  
3. **Make your changes**, ensuring the code follows the existing style (ESLint, Prettier).  
4. **Update documentation** – if you add new routes or UI elements, reflect them in this README.  
5. **Commit with clear messages** (`git commit -m "feat: add pagination to dashboard"`).  
6. **Open a Pull Request** against the `main` branch.  

> **Please do not commit** any `.env` files, secret keys, or database dumps. Use `.gitignore` to keep them out of the repository.  

---  

## License  

This project is licensed under the **MIT License** – see the `LICENSE` file for details.  

---  

### 🎉 Ready to manage your personal library?  

```bash
git clone https://github.com/your-username/ReadStash.git
cd ReadStash
npm install
npm run dev
```

Open **http://localhost:8000** and start adding the books you love!  
