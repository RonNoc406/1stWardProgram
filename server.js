const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    task TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL
  )`);
  // Insert some sample tasks
  db.get("SELECT COUNT(*) as count FROM tasks", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO tasks (date, task) VALUES (?, ?)", ["2025-10-01", "Prepare budget report"]);
      db.run("INSERT INTO tasks (date, task) VALUES (?, ?)", ["2025-10-02", "Team meeting"]);
    }
  });
});

// API to get tasks
app.get('/api/tasks', (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY date ASC", [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// API to add people
app.post('/api/people', (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) return res.status(400).json({error: "Name and phone required"});
  db.run("INSERT INTO people (name, phone) VALUES (?, ?)", [name, phone], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({id: this.lastID, name, phone});
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));