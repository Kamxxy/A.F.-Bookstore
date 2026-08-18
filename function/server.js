const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/images', express.static(path.join(__dirname, '../images')));

// Routes
// Serve index.html as the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve shop.html
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/shop.html'));
});

// API route to get books data
app.get('/api/books', (req, res) => {
  const booksPath = path.join(__dirname, '../data/books.json');
  fs.readFile(booksPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading books.json:', err);
      res.status(500).json({ error: 'Failed to load books' });
      return;
    }
    res.json(JSON.parse(data));
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the bookstore`);
});