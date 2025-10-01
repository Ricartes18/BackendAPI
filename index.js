require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 5000;

// In-memory storage for URLs
const urlDatabase = [];

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to create short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Validate URL format
  let urlObj;
  try {
    urlObj = new URL(originalUrl);
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  // Only accept http and https protocols
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return res.json({ error: 'invalid url' });
  }

  // Verify hostname using dns.lookup
  dns.lookup(urlObj.hostname, (err, address) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already exists
    const existingUrl = urlDatabase.find(item => item.original_url === originalUrl);
    if (existingUrl) {
      return res.json({
        original_url: existingUrl.original_url,
        short_url: existingUrl.short_url
      });
    }

    // Add new URL to database
    const shortUrl = urlDatabase.length + 1;
    urlDatabase.push({
      original_url: originalUrl,
      short_url: shortUrl
    });

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = parseInt(req.params.short_url);
  
  if (isNaN(shortUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const urlEntry = urlDatabase.find(item => item.short_url === shortUrl);
  
  if (!urlEntry) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  res.redirect(urlEntry.original_url);
});

app.listen(port, '0.0.0.0', function() {
  console.log(`Listening on port ${port}`);
});
