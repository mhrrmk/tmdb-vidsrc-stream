# TMDB Viewer with vidsrc Integration - Design Spec

**Date**: 2026-03-31  
**Status**: Approved

## Overview

Create a local HTML viewer that embeds themoviedb.org via a local proxy server, with a floating overlay that displays vidsrc links for movies and TV series.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     tmdb-viewer.html                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Overlay (always-on-top)                │   │
│  │  [🎬 vidsrc link] [Open in New Tab]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    iframe                            │   │
│  │              (localhost:8080 proxy)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     server.js (Proxy)                       │
│  - Listens on localhost:8080                                │
│  - Fetches themoviedb.org/*                                  │
│  - Rewrites relative URLs → absolute TMDB URLs              │
│  - Injects overlay script into TMDB HTML                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
https://www.themoviedb.org/
```

## Components

### 1. server.js (Proxy Server)

| Property | Value |
|----------|-------|
| Port | 8080 |
| Framework | Node.js + Express |

**Endpoints**:
- `GET /` → fetches TMDB homepage
- `GET /movie/:id` → fetches movie page  
- `GET /tv/:id` → fetches TV page
- `GET /tv/:id/season/:season/episode/:episode` → fetches episode page

**URL Rewriting**:
- `src="/..."` → `src="https://www.themoviedb.org/..."`
- `href="/..."` → `href="https://www.themoviedb.org/..."`

**Overlay Injection**: Injects floating overlay HTML/CSS/JS into all TMDB pages

### 2. Overlay (Injected JavaScript)

| Property | Value |
|----------|-------|
| Position | Fixed, top-right corner |
| z-index | 999999 |
| Display | Always visible, shows link on matching patterns |

**URL Pattern Matching**:
- Movie: `/movie/(\d+)`
- TV Episode: `/tv/(\d+)/season/(\d+)/episode/(\d+)`

**vidsrc Link Construction**:
- Movie: `https://vidsrcme.ru/embed/movie?tmdb={id}`
- TV: `https://vidsrcme.ru/embed/tv?tmdb={id}&season={season}&episode={episode}`

### 3. tmdb-viewer.html

- Full-screen iframe pointing to `http://localhost:8080`
- No margin/padding

### 4. start.sh

- Installs dependencies
- Starts server on port 8080
- Opens `tmdb-viewer.html` in Safari

## URL Patterns

| TMDB URL | Extracts | vidsrc Link |
|----------|---------|-------------|
| `/movie/1523145` | id=1523145 | `https://vidsrcme.ru/embed/movie?tmdb=1523145` |
| `/tv/2734/season/27/episode/1` | id=2734, season=27, episode=1 | `https://vidsrcme.ru/embed/tv?tmdb=2734&season=27&episode=1` |

## Error Handling

| Scenario | Handling |
|----------|----------|
| TMDB unreachable | Show error message in iframe |
| Invalid TMDB ID | Hide overlay |
| vidsrc unavailable | Show "Link unavailable" |

## Files

```
tmdb-vidsrc-stream/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-03-31-tmdb-viewer-design.md
├── server.js
├── tmdb-viewer.html
├── start.sh
└── package.json
```
