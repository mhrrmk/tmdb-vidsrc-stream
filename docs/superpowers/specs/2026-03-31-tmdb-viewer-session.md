# TMDB Viewer with vidsrc Integration - Session Summary

**Date:** 2026-03-31  
**Purpose:** Create a local HTML viewer that embeds themoviedb.org via a proxy server, with a floating overlay that displays vidsrc links for movies and TV series.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│               tmdb-viewer.html                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Overlay (fixed top, #032541 TMDB blue)       │  │
│  │ Shows vidsrc link when on movie/TV page      │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ iframe → localhost:8080 (proxy server)       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│               server.js (Express Proxy)            │
│  - Fetches themoviedb.org content                   │
│  - Rewrites relative URLs to proxy                  │
│  - Injects navigation interception script            │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
https://www.themoviedb.org/
```

---

## Files Created

| File | Purpose |
|------|---------|
| `server.js` | Express proxy server (port 8080) |
| `tmdb-viewer.html` | Viewer HTML with overlay |
| `start.sh` | Startup script |
| `package.json` | Node dependencies (bun-compatible) |

---

## vidsrc URL Patterns

| TMDB URL | Extracts | vidsrc Link |
|----------|---------|-------------|
| `/movie/1523145` | id=1523145 | `https://vidsrcme.ru/embed/movie?tmdb=1523145` |
| `/tv/60625/season/1/episode/2` | id=60625, s=1, e=2 | `https://vidsrcme.ru/embed/tv?tmdb=60625&season=1&episode=2` |

---

## TMDB URL Patterns Handled

- `/movie/{id}` - Movie detail pages
- `/tv/{id}/season/{s}/episode/{e}` - TV episode pages
- `/search` - Search page (with query params)
- `/movie` - Movies list
- `/tv` - TV shows list

---

## Key Technical Details

### Why Proxy Required

TMDB blocks iframe embedding via `X-Frame-Options` and `Content-Security-Policy` HTTP headers. This is standard security practice to prevent clickjacking.

### CSS Not Loading - Problem & Solution

**Problem:** TMDB is a React SPA - content and styles are rendered client-side. When axios fetches the page server-side, it only gets the initial HTML shell.

**Solution:** Added `/assets/*` route to proxy CSS files:
```javascript
app.get('/assets/*', async (req, res) => {
  const assetPath = '/assets/' + req.params[0];
  const response = await axios.get(TMDB_HOST + assetPath, {
    headers: { 'User-Agent': 'Mozilla/5.0...' },
    responseType: 'arraybuffer'
  });
  res.setHeader('Content-Type', response.headers['content-type']);
  res.send(response.data);
});
```

### Overlay Not Appearing - Multiple Failed Attempts

1. **postMessage from iframe:** Failed - cross-origin blocked
2. **localStorage events:** Failed - cross-origin blocked  
3. **MutationObserver:** Failed - cannot observe cross-origin iframe
4. **document.title change:** Could work but wasn't implemented

**Final Working Solution:** Check iframe `src` attribute directly via polling:
```javascript
function checkSrc() {
  const src = frame.src;
  if (src !== lastSrc) {
    lastSrc = src;
    const url = new URL(src);
    updateOverlay(url.pathname + url.search);
  }
}
setInterval(checkSrc, 300);
```

### Overlay Design

- Located in parent page (`tmdb-viewer.html`), not injected into iframe
- Background: `#032541` (TMDB blue)
- Height: 60px, fixed at top
- Only shows link (no label)
- Link color: `#00d4ff`

### URL Rewriting

Only rewrites relative URLs:
```javascript
function rewriteUrls(html) {
  let result = html;
  result = result.replace(/src="\//g, 'src="http://localhost:8080/');
  result = result.replace(/href="\//g, 'href="http://localhost:8080/');
  // Does NOT rewrite absolute themoviedb.org URLs
  // Those navigate through proxy naturally
  return result;
}
```

---

## Code Snippets

### tmdb-viewer.html - Overlay Detection

```html
<style>
#vidsrc-overlay {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 60px;
  background-color: #032541;
  z-index: 999999999;
  display: flex;
  align-items: center;
  padding: 0 20px;
}
#vidsrc-link {
  color: #00d4ff;
  font-size: 14px;
  text-decoration: none;
}
#tmdb-frame {
  position: fixed;
  top: 60px;
  width: 100%;
  height: calc(100% - 60px);
  border: none;
}
</style>

<script>
const link = document.getElementById('vidsrc-link');
const frame = document.getElementById('tmdb-frame');
const vidSrcBase = 'https://vidsrcme.ru';

function updateOverlay(path) {
  const movieMatch = path.match(/\/movie\/(\d+)/);
  const tvMatch = path.match(/\/tv\/(\d+)[^\/]*\/season\/(\d+)\/episode\/(\d+)/);

  if (movieMatch) {
    const tmdbId = movieMatch[1];
    link.href = vidSrcBase + '/embed/movie?tmdb=' + tmdbId;
    link.textContent = link.href;
  } else if (tvMatch) {
    const tmdbId = tvMatch[1];
    const season = tvMatch[2];
    const episode = tvMatch[3];
    link.href = vidSrcBase + '/embed/tv?tmdb=' + tmdbId + '&season=' + season + '&episode=' + episode;
    link.textContent = link.href;
  } else {
    link.textContent = '';
    link.href = '#';
  }
}

function checkSrc() {
  const src = frame.src;
  if (src !== lastSrc) {
    lastSrc = src;
    try {
      const url = new URL(src);
      updateOverlay(url.pathname + url.search);
    } catch(e) {}
  }
}

setInterval(checkSrc, 300);
frame.addEventListener('load', checkSrc);
</script>
```

### server.js - Overlay Script (Injected)

```javascript
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
        window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
      } catch (e) {}
    }, 1000);

    var originalPushState = history.pushState;
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(function() {
        try {
          var path = window.location.pathname + window.location.search;
          window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
        } catch (e) {}
      }, 300);
    };
    window.addEventListener('popstate', function() {
      setTimeout(function() {
        try {
          var path = window.location.pathname + window.location.search;
          window.parent.postMessage({ type: 'tmdb-url', path: path }, '*');
        } catch (e) {}
      }, 300);
    });
  })();
});
</script>
`;
```

### server.js - Key Routes

```javascript
app.get('/', async (req, res) => {
  const response = await axios.get(TMDB_HOST, { headers: {...} });
  let html = rewriteUrls(response.data);
  html = html.replace('</body>', overlayScript + '</body>');
  res.send(html);
});

app.get('/search', async (req, res) => {
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
  const response = await axios.get(TMDB_HOST + '/search' + queryString, {...});
  // ...
});

app.get('/movie', async (req, res) => { /* ... */ });
app.get('/tv', async (req, res) => { /* ... */ });
app.get('/movie/:id', async (req, res) => { /* ... */ });
app.get('/tv/:id', async (req, res) => { /* ... */ });
app.get('/tv/:id/season/:season/episode/:episode', async (req, res) => { /* ... */ });

app.get('/assets/*', async (req, res) => {
  // Proxy CSS and other assets
});

app.get('*', async (req, res) => {
  // Catch-all for other routes
});
```

---

## Usage

```bash
# Start the application
./start.sh

# Or manually:
~/.bun/bin/bun run server.js &
open tmdb-viewer.html
```

Server runs on `http://localhost:8080`

---

## Issues Encountered & Solutions

| Issue | Solution |
|-------|----------|
| Stylesheets not loading | Add `/assets/*` proxy route for CSS files |
| TMDB top bar not showing | Remove JS overlay injection; use parent page overlay |
| Overlay not appearing | Use inline styles with `!important`, poll iframe src |
| iframe too small | Use `calc(100% - 60px)` for height |
| postMessage blocked | Cross-origin restriction - fall back to src polling |

---

## Tech Stack

- **Runtime:** Bun (Node.js compatible)
- **Server:** Express.js
- **HTTP Client:** Axios
- **Frontend:** Vanilla HTML/JS/CSS
