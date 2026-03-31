import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const TMDB_HOST = 'https://www.themoviedb.org';

const overlayScript = `
<script>
window.addEventListener('load', function() {
  (function() {
    try {
      var currentPath = window.location.pathname + window.location.search;
      document.title = 'TMDB:' + currentPath;
      window.parent.postMessage({ type: 'tmdb-url', path: currentPath }, '*');
    } catch (e) {}
    
    setInterval(function() {
      try {
        var path = window.location.pathname + window.location.search;
        document.title = 'TMDB:' + path;
        window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
      } catch (e) {}
    }, 1000);

    var originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(function() {
        try {
          var path = window.location.pathname + window.location.search;
          document.title = 'TMDB:' + path;
          window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
        } catch (e) {}
      }, 300);
    };
    window.addEventListener('popstate', function() {
      setTimeout(function() {
        try {
          var path = window.location.pathname + window.location.search;
          document.title = 'TMDB:' + path;
          window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
        } catch (e) {}
      }, 300);
    });
  })();
});
</script>
`;

function rewriteUrls(html) {
  let result = html;
  result = result.replace(/src="\//g, `src="${BASE_URL}/`);
  result = result.replace(/href="\//g, `href="${BASE_URL}/`);
  result = result.replace(/src='\//g, `src='${BASE_URL}/`);
  result = result.replace(/href='\//g, `href='${BASE_URL}/`);
  return result;
}

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'tmdb-viewer.html'));
});

app.get('/browse', async (req, res) => {
  try {
    const response = await axios.get(TMDB_HOST, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/search', async (req, res) => {
  try {
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const response = await axios.get(TMDB_HOST + '/search' + queryString, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/search/:query', async (req, res) => {
  try {
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const response = await axios.get(TMDB_HOST + '/search' + queryString, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/movie', async (req, res) => {
  try {
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const response = await axios.get(TMDB_HOST + '/movie' + queryString, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/tv', async (req, res) => {
  try {
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const response = await axios.get(TMDB_HOST + '/tv' + queryString, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/movie/:id', async (req, res) => {
  try {
    const response = await axios.get(TMDB_HOST + '/movie/' + req.params.id, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/tv/:id', async (req, res) => {
  try {
    const response = await axios.get(TMDB_HOST + '/tv/' + req.params.id, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/tv/:id/season/:season/episode/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const response = await axios.get(TMDB_HOST + '/tv/' + id + '/season/' + season + '/episode/' + episode, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.get('/assets/*', async (req, res) => {
  try {
    const assetPath = '/assets/' + req.params[0];
    const response = await axios.get(TMDB_HOST + assetPath, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'] || 'text/plain';
    res.setHeader('Content-Type', contentType);
    res.send(response.data);
  } catch (error) {
    res.status(404).send('Asset not found: ' + error.message);
  }
});

app.get('/t/p/*', async (req, res) => {
  try {
    const imagePath = '/t/p/' + req.params[0];
    const response = await axios.get('https://media.themoviedb.org' + imagePath, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.themoviedb.org/'
      },
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(response.data);
  } catch (error) {
    res.status(404).send('Image not found: ' + error.message);
  }
});

app.get('*', async (req, res) => {
  try {
    const response = await axios.get(TMDB_HOST + req.path, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    let html = rewriteUrls(response.data);
    html = html.replace('</body>', overlayScript + '</body>');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error fetching TMDB: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`TMDB Proxy Server running on port ${PORT}`);
});
