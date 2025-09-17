const express = require('express');
const db = require('../models/database');
const { isAuthenticated } = require('../middleware/auth');
const router = express.Router();

// User dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM quizzes", (err, quizzes) => {
        if (err) {
            return res.render('error', { message: 'Database error' });
        }
        
        // Get user's previous results
        db.all(`
            SELECT results.*, quizzes.title 
            FROM results 
            JOIN quizzes ON results.quiz_id = quizzes.id 
            WHERE user_id = ?
        `, [req.session.user.id], (err, results) => {
            if (err) {
                return res.render('error', { message: 'Database error' });
            }
            
            res.render('user/dashboard', { quizzes, results });
        });
    });
});

// Take quiz
router.get('/take-quiz/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    
    db.all("SELECT * FROM questions WHERE quiz_id = ?", [id], (err, questions) => {
        if (err || !questions.length) {
            return res.render('error', { message: 'Quiz not found or no questions available' });
        }
        
        db.get("SELECT * FROM quizzes WHERE id = ?", [id], (err, quiz) => {
            if (err || !quiz) {
                return res.render('error', { message: 'Quiz not found' });
            }
            
            res.render('user/quiz', { questions, quiz });
        });
    });
});

// Submit quiz
router.post('/submit-quiz/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const userAnswers = req.body;
    
    db.all("SELECT * FROM questions WHERE quiz_id = ?", [id], (err, questions) => {
        if (err || !questions.length) {
            return res.render('error', { message: 'Quiz not found' });
        }
        
        let score = 0;
        questions.forEach(question => {
            if (userAnswers[`question_${question.id}`] === question.correct_answer) {
                score++;
            }
        });
        
        // Save result
        db.run(
            "INSERT INTO results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)",
            [req.session.user.id, id, score, questions.length],
            function(err) {
                if (err) {
                    console.error(err);
                }
                
                res.render('user/result', { 
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