
const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5173;

// Serve static files as before
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to run the KarmaSracper.py script
app.post('/run-karma-scraper', (req, res) => {
  exec('python3 ../../KarmaSracper.py', { cwd: path.resolve(__dirname, '../..') }, (error, stdout, stderr) => {
    if (error) {
      console.error('Scraper error:', error, stderr);
      return res.status(500).json({ success: false, error: stderr || error.message });
    }
    res.json({ success: true, output: stdout });
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Finance dashboard server running on http://localhost:${PORT}`);
});
