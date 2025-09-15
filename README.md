# YouTube Audio Streaming API

A Node.js backend service that streams YouTube audio as MP3 files, perfect for Discord bots and other applications.

## Features

- 🔍 Search YouTube videos
- 🎵 Stream audio as MP3
- 🤖 Discord bot friendly
- ⚡ Fast streaming with ffmpeg
- 📱 Browser-friendly test interface

## API Endpoints

### `GET /`

Test interface for trying all endpoints

### `GET /health`

Health check endpoint

### `GET /search?q={query}`

Search for YouTube videos

- Returns: JSON with video results

### `GET /stream?id={videoId}`

Stream audio by YouTube video ID

- Returns: MP3 audio stream

### `GET /stream?q={query}`

Stream audio by search query (uses first result)

- Returns: MP3 audio stream

### `GET /stream-fixed`

Test endpoint with a fixed video

- Returns: MP3 audio stream

## Quick Deployment Options

### 1. Railway (Recommended)

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Deploy automatically

### 2. Heroku

```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

### 3. Docker

```bash
docker build -t youtube-audio-api .
docker run -p 3000:3000 youtube-audio-api
```

### 4. VPS/Server

```bash
# Upload files to server
npm install
npm start
```

## Environment Variables

```
PORT=3000  # Optional, defaults to 3000
```

## Local Development

```bash
npm install
npm start
# Visit http://localhost:3000 for test interface
```

## Discord Bot Integration

Example Discord.js code:

```javascript
const streamUrl = `https://your-deployed-url.com/stream?q=${encodeURIComponent(
  query
)}`;
// Use this URL with your Discord audio player
```

## Deployment Services

### Free Options:

- **Railway** (Recommended) - railway.app
- **Render** - render.com
- **Fly.io** - fly.io

### VPS Options:

- **DigitalOcean** - $5/month
- **Linode** - $5/month
- **Vultr** - $3.50/month

## Notes

- Service handles YouTube's changing APIs automatically
- Built-in caching for better performance
- Error handling for robust operation
- CORS enabled for browser usage

# Ishi-backend
