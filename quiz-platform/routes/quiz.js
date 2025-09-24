const express = require('express');
const db = require('../models/database');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Admin dashboard
router.get('/admin/dashboard', isAuthenticated, isAdmin, (req, res) => {
    db.all(`
        SELECT quizzes.*, COUNT(questions.id) as question_count 
        FROM quizzes 
        LEFT JOIN questions ON quizzes.id = questions.quiz_id 
        GROUP BY quizzes.id
    `, (err, quizzes) => {
        if (err) {
            return res.render('error', { message: 'Database error' });
        }
        res.render('admin/dashboard', { quizzes });
    });
});

// Add quiz form
router.get('/admin/add', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/add-quiz', { errors: [], formData: {} });
});

// Add quiz processing
router.post('/admin/add', isAuthenticated, isAdmin, (req, res) => {
    const { title, description } = req.body;
    
    if (!title) {
        return res.render('admin/add-quiz', { 
            errors: [{ msg: 'Title is required' }], 
            formData: req.body 
        });
    }
    
    db.run(
        "INSERT INTO quizzes (title, description, created_by) VALUES (?, ?, ?)",
        [title, description, req.session.user.id],
        function(err) {
            if (err) {
                return res.render('admin/add-quiz', { 
                    errors: [{ msg: 'Database error' }], 
                    formData: req.body 
                });
            }
            
            // Instead of redirecting, render the add-questions page directly
            res.render('admin/add-questions', { 
                quiz: { id: this.lastID, title: title }, 
                errors: [], 
                formData: {},
                success: false
            });
        }
    );
});

// Add questions form for existing quiz
router.get('/admin/add-questions-to/:quizId', isAuthenticated, isAdmin, (req, res) => {
    const { quizId } = req.params;
    
    db.get("SELECT * FROM quizzes WHERE id = ?", [quizId], (err, quiz) => {
        if (err || !quiz) {
            return res.render('error', { message: 'Quiz not found' });
        }
        
        res.render('admin/add-questions', { 
            quiz: quiz, 
            errors: [], 
            formData: {},
            success: false
        });
    });
});

// Add questions processing
router.post('/admin/add-questions/:quizId', isAuthenticated, isAdmin, (req, res) => {
    const { quizId } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    
    if (!question_text || !option_a || !option_b || !correct_answer) {
        return res.render('admin/add-questions', { 
            quiz: { id: quizId }, 
            errors: [{ msg: 'Question text, options, and correct answer are required' }], 
            formData: req.body,
            success: false
        });
    }
    
    db.run(
        `INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [quizId, question_text, option_a, option_b, option_c, option_d, correct_answer],
        function(err) {
            if (err) {
                return res.render('admin/add-questions', { 
                    quiz: { id: quizId }, 
                    errors: [{ msg: 'Database error' }], 
                    formData: req.body,
                    success: false
                });
            }
            
            res.render('admin/add-questions', { 
                quiz: { id: quizId }, 
                errors: [], 
                formData: {},
                success: true
            });
        }
    );
});

// Manage quizzes
router.get('/admin/manage', isAuthenticated, isAdmin, (req, res) => {
    db.all(`
        SELECT quizzes.*, COUNT(questions.id) as question_count 
        FROM quizzes 
        LEFT JOIN questions ON quizzes.id = questions.quiz_id 
        GROUP BY quizzes.id
    `, (err, quizzes) => {
        if (err) {
            return res.render('error', { message: 'Database error' });
        }
        res.render('admin/manage-quizzes', { quizzes });
    });
});

// Delete quiz
// Delete quiz
router.delete('/admin/delete/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete quiz with ID: ${id}`);
    
    // First, check if foreign keys are enabled
    db.get("PRAGMA foreign_keys", (err, row) => {
        if (err) {
            console.error("Error checking foreign keys:", err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        console.log("Foreign keys enabled:", row.foreign_keys);
        
        // Since we have ON DELETE CASCADE, we can just delete the quiz
        // and the database will automatically delete related questions and results
        db.run("DELETE FROM quizzes WHERE id = ?", [id], function(err) {
            if (err) {
                console.error("Error deleting quiz:", err);
                return res.status(500).json({ success: false, message: 'Database error: Could not delete quiz' });
            }
            
            console.log(`Deleted quiz with ID: ${id}. Changes: ${this.changes}`);
            
            if (this.changes === 0) {
                return res.status(404).json({ success: false, message: 'Quiz not found' });
            }
            
            res.json({ success: true, message: 'Quiz deleted successfully' });
        });
    });
});

// View quiz questions
router.get('/admin/questions/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    db.all("SELECT * FROM questions WHERE quiz_id = ?", [id], (err, questions) => {
        if (err) {
            return res.render('error', { message: 'Database error' });
        }
        res.render('admin/quiz-questions', { questions, quizId: id });
    });
});

// Delete question
router.delete('/admin/question/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    
    db.run("DELETE FROM questions WHERE id = ?", [id], function(err) {
        if (err) { 
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }
        
        res.json({ success: true, message: 'Question deleted successfully' });
    });
});

module.exports = router;