# TMDB Viewer with vidsrc Integration - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a local HTML viewer that embeds themoviedb.org via a local proxy server, with a floating overlay that displays vidsrc links for movies and TV series.

**Architecture:** Node.js Express proxy server fetches TMDB, rewrites URLs, injects overlay JavaScript. HTML viewer displays in iframe with always-on-top overlay.

**Tech Stack:** Node.js, Express, vanilla JavaScript

---

## File Structure

```
tmdb-vidsrc-stream/
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-03-31-tmdb-viewer-design.md
│       └── plans/
│           └── 2026-03-31-tmdb-viewer-plan.md
├── server.js          # Proxy server
├── tmdb-viewer.html   # HTML viewer with overlay
├── start.sh           # Start script
└── package.json       # Node dependencies
```

---

## Task 1: Create package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "tmdb-vidsrc-stream",
  "version": "1.0.0",
  "description": "Local TMDB viewer with vidsrc integration",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0"
  }
}
```

---

## Task 2: Create server.js (Proxy Server)

**Files:**
- Create: `server.js`

- [ ] **Step 1: Write server.js**

```javascript
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 8080;
const TMDB_HOST = 'https://www.themoviedb.org';

const overlayScript = `
<script>
(function() {
  const overlay = document.createElement('div');
  overlay.id = 'vidsrc-overlay';
  overlay.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a1a;color:#fff;padding:12px 16px;border-radius:8px;font-family:system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.4);max-width:320px;';
  
  const linkContainer = document.createElement('div');
  linkContainer.id = 'vidsrc-link-container';
  linkContainer.style.cssText = 'display:none;';
  
  const link = document.createElement('a');
  link.id = 'vidsrc-link';
  link.target = '_blank';
  link.style.cssText = 'color:#00d4ff;text-decoration:none;font-size:14px;word-break:break-all;';
  
  const openBtn = document.createElement('button');
  openBtn.id = 'vidsrc-open-btn';
  openBtn.textContent = 'Open in New Tab';
  openBtn.style.cssText = 'display:block;margin-top:8px;padding:6px 12px;background:#00d4ff;color:#000;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;';
  
  linkContainer.appendChild(link);
  linkContainer.appendChild(openBtn);
  overlay.appendChild(linkContainer);
  document.body.appendChild(overlay);

  const vidSrcBase = 'https://vidsrcme.ru';

  function updateOverlay() {
    const pathname = window.location.pathname;
    const movieMatch = pathname.match(/\\/movie\\/(\\d+)/);
    const tvMatch = pathname.match(/\\/tv\\/(\\d+)\\/season\\/(\\d+)\\/episode\\/(\\d+)/);

    if (movieMatch) {
      const tmdbId = movieMatch[1];
      const vidSrcUrl = vidSrcBase + '/embed/movie?tmdb=' + tmdbId;
      link.href = vidSrcUrl;
      link.textContent = vidSrcUrl;
      linkContainer.style.display = 'block';
    } else if (tvMatch) {
      const tmdbId = tvMatch[1];
      const season = tvMatch[2];
      const episode = tvMatch[3];
      const vidSrcUrl = vidSrcBase + '/embed/tv?tmdb=' + tmdbId + '&season=' + season + '&episode=' + episode;
      link.href = vidSrcUrl;
      link.textContent = vidSrcUrl;
      linkContainer.style.display = 'block';
    } else {
      linkContainer.style.display = 'none';
    }
  }

  openBtn.addEventListener('click', function() {
    window.open(link.href, '_blank');
  });

  updateOverlay();

  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(updateOverlay, 100);
  };

  window.addEventListener('popstate', function() {
    setTimeout(updateOverlay, 100);
  });

  const observer = new MutationObserver(function() {
    setTimeout(updateOverlay, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
</script>
`;

function rewriteUrls(html) {
  let result = html;
  result = result.replace(/src="\//g, 'src="' + TMDB_HOST + '/');
  result = result.replace(/href="\//g, 'href="' + TMDB_HOST + '/');
  result = result.replace(/src='\//g, "src='" + TMDB_HOST + "/'");
  result = result.replace(/href='\//g, "href='" + TMDB_HOST + "/'");
  return result;
}

app.get('/', async (req, res) => {
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
  console.log('TMDB Proxy Server running on http://localhost:' + PORT);
});
```

---

## Task 3: Create tmdb-viewer.html

**Files:**
- Create: `tmdb-viewer.html`

- [ ] **Step 1: Write tmdb-viewer.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TMDB Viewer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="http://localhost:8080" allow="fullscreen"></iframe>
</body>
</html>
```

---

## Task 4: Create start.sh

**Files:**
- Create: `start.sh`

- [ ] **Step 1: Write start.sh**

```bash
#!/bin/bash

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Starting TMDB Proxy Server..."
node server.js &
SERVER_PID=$!

sleep 2

echo "Opening tmdb-viewer.html in Safari..."
open -a Safari tmdb-viewer.html

echo "Server running on http://localhost:8080"
echo "Press Ctrl+C to stop the server"

trap "kill $SERVER_PID" EXIT

wait
```

- [ ] **Step 2: Make start.sh executable**

Run: `chmod +x start.sh`

---

## Task 5: Test the Implementation

**Files:**
- Test: All created files

- [ ] **Step 1: Install dependencies and start server**

Run: `npm install`

Expected: express and axios installed

- [ ] **Step 2: Start the application**

Run: `./start.sh` (or `bash start.sh`)

Expected:
- Server starts on port 8080
- tmdb-viewer.html opens in Safari
- TMDB homepage loads in iframe
- Overlay visible in top-right corner

- [ ] **Step 3: Test movie page navigation**

In the iframe:
1. Navigate to any movie (e.g., /movie/1523145)
2. Verify overlay shows vidsrc link
3. Click "Open in New Tab" - should open vidsrc

- [ ] **Step 4: Test TV episode page navigation**

In the iframe:
1. Navigate to any TV episode (e.g., /tv/2734/season/27/episode/1)
2. Verify overlay shows vidsrc link with season/episode
3. Click "Open in New Tab" - should open vidsrc

- [ ] **Step 5: Test non-matching pages**

Navigate to homepage or other pages - overlay should be empty/hidden

---

## Notes

- TMDB is a React SPA, so URL rewriting may not capture all client-side routes. The overlay script includes MutationObserver and history.pushState overrides to handle SPA navigation.
- If TMDB adds Content-Security-Policy headers blocking the proxy, a different approach may be needed.
- The vidsrc URL pattern may change - verify `vidsrcme.ru` is the correct domain.
