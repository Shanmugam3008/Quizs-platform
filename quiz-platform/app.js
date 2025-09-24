const express = require('express');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

// Import routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');

// Import database initialization
require('./models/database');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
    secret: 'quiz-platform-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Make session data available in templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.isAdmin = req.session.user ? req.session.user.role === 'admin' : false;
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/quiz', quizRoutes);
app.use('/user', userRoutes);

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'admin') {
            res.redirect('/quiz/admin/dashboard');
        } else {
            res.redirect('/user/dashboard');
        }
    } else {
        res.redirect('/login');
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Something went wrong!' });
});

app.use((req, res, next) => {
  res.locals.currentPath = req.path;   // now available in all EJS templates
  res.locals.user = req.user || null;  // also make user available globally
  next();
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});