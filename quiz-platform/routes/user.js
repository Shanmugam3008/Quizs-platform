const express = require('express');
const db = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');
const { sendThankYouEmail } = require('../emailService');
const router = express.Router();

// ---------------- User Dashboard ----------------
router.get('/dashboard', isAuthenticated, (req, res) => {
    console.log('Dashboard accessed by user:', req.session.user.username);
    
    db.all("SELECT * FROM quizzes", (err, quizzes) => {
        if (err) {
            console.error('Dashboard quiz error:', err);
            return res.render('error', { message: 'Database error' });
        }

        db.all(`
            SELECT results.*, quizzes.title 
            FROM results
            JOIN quizzes ON results.quiz_id = quizzes.id
            WHERE user_id = ?
        `, [req.session.user.id], (err, results) => {
            if (err) {
                console.error('Dashboard results error:', err);
                return res.render('error', { message: 'Database error' });
            }

            console.log('Rendering dashboard with:', quizzes.length, 'quizzes,', results.length, 'results');
            res.render('user/dashboard', {
                user: req.session.user,
                quizzes,
                results
            });
        });
    });
});

// ---------------- User Profile ----------------
router.get('/profile', isAuthenticated, (req, res) => {
    console.log('Profile accessed by user:', req.session.user.username);
    
    const user = req.session.user;
    db.all(`
        SELECT results.*, quizzes.title
        FROM results
        JOIN quizzes ON results.quiz_id = quizzes.id
        WHERE user_id = ?
        ORDER BY results.created_at DESC
    `, [user.id], (err, results) => {
        if (err) {
            console.error('Profile error:', err);
            return res.render('error', { message: 'Database error' });
        }

        console.log('Rendering profile with', results.length, 'results');
        res.render('user/profile', { 
            user: user, 
            results: results 
        });
    });
});

// ---------------- User Results (Detailed) ----------------
router.get('/results', isAuthenticated, (req, res) => {
    console.log('Results accessed by user:', req.session.user.username);
    
    const user = req.session.user;
    db.all(`
        SELECT results.*, quizzes.title, quizzes.description
        FROM results
        JOIN quizzes ON results.quiz_id = quizzes.id
        WHERE user_id = ?
        ORDER BY results.created_at DESC
    `, [user.id], (err, results) => {
        if (err) {
            console.error('Results error:', err);
            return res.render('error', { message: 'Database error' });
        }

        console.log('Rendering results with', results.length, 'results');
        res.render('user/results', { 
            user: user, 
            results: results 
        });
    });
});

// ---------------- Take Quiz ----------------
router.get('/take-quiz/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    console.log('Take quiz accessed:', id, 'by user:', req.session.user.username);

    db.all("SELECT * FROM questions WHERE quiz_id = ?", [id], (err, questions) => {
        if (err || !questions.length) {
            console.error('Take quiz error:', err);
            return res.render('error', { message: 'Quiz not found or no questions available' });
        }

        db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
            if (err || !quiz) {
                console.error('Quiz not found:', err);
                return res.render('error', { message: 'Quiz not found' });
            }

            res.render('user/quiz', {
                user: req.session.user,
                questions,
                quiz
            });
        });
    });
});

// ---------------- Submit Quiz ----------------
router.post('/submit-quiz/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const userAnswers = req.body;
    console.log('Submit quiz:', id, 'by user:', req.session.user.username);

    db.all("SELECT * FROM questions WHERE quiz_id = ?", [id], (err, questions) => {
        if (err || !questions.length) {
            console.error('Submit quiz error:', err);
            return res.render('error', { message: 'Quiz not found' });
        }

        let score = 0;
        questions.forEach(q => {
            if (userAnswers[`question_${q.id}`] === q.correct_answer) score++;
        });

        // Save result
        db.run(
            "INSERT INTO results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)",
            [req.session.user.id, id, score, questions.length],
            async (err) => {
                if (err) console.error('Error saving result:', err);

                // Email thank-you note
                db.get("SELECT * FROM users WHERE id = ?", [req.session.user.id], (err, user) => {
                    if (!err && user && user.email) {
                        db.get("SELECT * FROM quizzes WHERE id = ?", [id], async (err, quiz) => {
                            if (!err && quiz) {
                                try {
                                    await sendThankYouEmail(
                                        user.email,
                                        user.username,
                                        quiz.title,
                                        `${score}/${questions.length} (${((score / questions.length) * 100).toFixed(2)}%)`
                                    );
                                } catch (e) {
                                    console.error('Email error:', e);
                                }
                            }
                        });
                    }
                });

                // Render individual result page
                res.render('user/result', {
                    user: req.session.user,
                    score,
                    total: questions.length,
                    percentage: ((score / questions.length) * 100).toFixed(2),
                    quizId: id
                });
            }
        );
    });
});

module.exports = router;    