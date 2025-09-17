// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Store DB in the same folder as database.js
const dbPath = path.resolve(__dirname, "quiz.db");

// Open connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at", dbPath);
  }
});

// Create tables if they don’t exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL CHECK (is_correct IN (0,1)),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  console.log("✅ Tables are ready");
});

// Example: Insert a quiz if none exists
db.get(`SELECT COUNT(*) AS count FROM quizzes`, (err, row) => {
  if (err) {
    console.error("❌ Error checking quizzes:", err.message);
  } else if (row.count === 0) {
    db.run(
      `INSERT INTO quizzes (title, description) VALUES (?, ?)`,
      ["Sample Quiz", "This is a test quiz"],
      function (err) {
        if (err) {
          console.error("❌ Error inserting quiz:", err.message);
        } else {
          console.log("✅ Sample quiz inserted with ID:", this.lastID);
        }
      }
    );
  }
});

// Example: Fetch quizzes
db.all(`SELECT * FROM quizzes`, (err, rows) => {
  if (err) {
    console.error("❌ Error fetching quizzes:", err.message);
  } else {
    console.log("📋 Quizzes:", rows);
  }
});

// Close connection when finished
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err.message);
    } else {
      console.log("✅ Database connection closed");
    }
    process.exit(0);
  });
});
