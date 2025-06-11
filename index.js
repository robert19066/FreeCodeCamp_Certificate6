require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false })); // parse POST body
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// In-memory DB
const urlDatabase = {};
let urlCounter = 1;

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format using WHATWG URL and regex
  let hostname;
  try {
    const parsedUrl = new URL(originalUrl);
    hostname = parsedUrl.hostname;
  } catch {
    return res.json({ error: 'invalid url' });
  }

  // Simple regex to check protocol presence (http or https)
  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup to verify host exists
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if URL already shortened, return existing short_url
    for (const shortUrl in urlDatabase) {
      if (urlDatabase[shortUrl] === originalUrl) {
        return res.json({
          original_url: originalUrl,
          short_url: Number(shortUrl),
        });
      }
    }

    // Add new URL
    const shortUrl = urlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl,
    });
  });
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;

  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    return res.redirect(originalUrl);
  }
  return res.json({ error: 'No short URL found for the given input' });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
