// routes/user.js - Updated dashboard route
router.get('/dashboard', isAuthenticated, (req, res) => {
    // Get available quizzes
    db.all("SELECT * FROM quizzes WHERE id IN (SELECT DISTINCT quiz_id FROM questions)", (err, quizzes) => {
        if (err) {
            console.error(err);
            return res.render('error', { message: 'Database error' });
        }
        
        // Get user's previous results with quiz titles
        db.all(`
            SELECT r.*, q.title 
            FROM results r 
            JOIN quizzes q ON r.quiz_id = q.id 
            WHERE r.user_id = ? 
            ORDER BY r.created_at DESC
        `, [req.session.user.id], (err, results) => {
            if (err) {
                console.error(err);
                return res.render('error', { message: 'Database error' });
            }
            
            res.render('user/dashboard', { 
                quizzes, 
                results,
                user: req.session.user 
            });
        });
    });
});