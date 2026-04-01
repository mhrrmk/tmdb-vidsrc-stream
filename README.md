# TMDB VidSrc Stream

A local TMDB viewer that integrates with vidsrc to stream movies and TV shows directly in your browser.

## Usage

### Quick Start (Bun)

```bash
bun run server.js
```

Then open `http://localhost:8080/` in your browser.

### Quick Start (Node.js)

```bash
npm start
```

### Custom Port

Set the `PORT` environment variable:

```bash
PORT=3000 bun run server.js
```

### Custom Base URL

Set the `BASE_URL` environment variable to serve the app at a different path:

```bash
BASE_URL=/my-app bun run server.js
```

## How It Works

1. The server serves the TMDB UI at the root path
2. When you navigate to a movie (`/movie/{id}`) or TV show (`/tv/{id}/season/{season}/episode/{episode}`), an overlay bar appears at the top
3. Clicking the link in the overlay opens the stream in vidsrc
4. The iframe updates automatically as you browse different movies/episodes