const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../models/database');
const router = express.Router();

// Your admin secret code
const ADMIN_SECRET_CODE = "HR_ADMIN_2023";

// Login page
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/login', { errors: [], formData: {}, successMessage: null });
});

// Login processing
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', { errors: errors.array(), formData: req.body, successMessage: null });
    }

    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            return res.render('auth/login', { errors: [{ msg: 'Database error' }], formData: req.body, successMessage: null });
        }

        if (!user) {
            return res.render('auth/login', { errors: [{ msg: 'Invalid username or password' }], formData: req.body, successMessage: null });
        }

        if (bcrypt.compareSync(password, user.password)) {
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };
            
            if (user.role === 'admin') {
                res.redirect('/quiz/admin/dashboard');
            } else {
                res.redirect('/user/dashboard');
            }
        } else {
            res.render('auth/login', { errors: [{ msg: 'Invalid username or password' }], formData: req.body, successMessage: null });
        }
    });
});

// Register page
router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('auth/register', { errors: [], formData: {} });
});

// Register processing
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match');
        }
        return true;
    })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/register', { errors: errors.array(), formData: req.body });
    }

    const { username, email, password, adminCode } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Check if admin code is correct
    const role = (adminCode === ADMIN_SECRET_CODE) ? 'admin' : 'user';

    db.run(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, role],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.render('auth/register', { 
                        errors: [{ msg: 'Username or email already exists' }], 
                        formData: req.body 
                    });
                }
                return res.render('auth/register', { 
                    errors: [{ msg: 'Database error' }], 
                    formData: req.body 
                });
            }
            
            // If admin registration, show success message
            if (role === 'admin') {
                req.session.successMessage = 'Admin account created successfully!';
            }
            
            res.redirect('/login');
        }
    );
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;
