const sqlite3 = require('sqlite3').verbose();

// Connect to the database
let db = new sqlite3.Database('./quiz.db', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
  }
});

const quizId = 2; // The quiz ID you want to fetch questions for

// Query to fetch all questions for the quiz
db.all("SELECT * FROM questions WHERE quiz_id = ?;", [quizId], (err, rows) => {
  if (err) {
    console.error(err.message);
  } else if (rows.length === 0) {
    console.log(`No questions found for Quiz ID ${quizId}.`);
  } else {
    console.log(`Questions for Quiz ID ${quizId}:`);
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.question_text}`);
      console.log(`   A: ${row.option_a}`);
      console.log(`   B: ${row.option_b}`);
      console.log(`   C: ${row.option_c || 'N/A'}`);
      console.log(`   D: ${row.option_d || 'N/A'}`);
      console.log(`   Correct Answer: ${row.correct_answer}\n`);
    });
  }
  db.close((err) => {
    if (err) console.error(err.message);
    console.log('Closed the database connection.');
  });
});
