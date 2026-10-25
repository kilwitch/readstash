const { validateToken } = require('../services/authentication');

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        res.locals.user = null;
        req.user = null;

        if (!tokenCookieValue) {
            return next();
        }

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload;
            res.locals.user = userPayload;
        } catch (error) {
            // Invalid or expired token; clear it so user is not stuck with bad cookie
            res.clearCookie(cookieName);
        }
        return next();
    };
}

function requireAuth(req, res, next) {
    if (!req.user) {
        return res.redirect('/user/signin?message=' + encodeURIComponent('Please sign in to access your bookshelf'));
    }
    next();
}

function redirectIfAuthenticated(req, res, next) {
    if (req.user) {
        return res.redirect('/');
    }
    next();
}

module.exports = {
    checkForAuthenticationCookie,
    requireAuth,
    redirectIfAuthenticated,
};