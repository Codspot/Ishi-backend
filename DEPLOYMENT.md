# 🚀 DEPLOYMENT GUIDE

Your YouTube Audio Streaming API is ready for deployment! Here are the best options:

## ✅ WORKING ENDPOINTS

All endpoints are now working locally:
- Health Check: `http://localhost:3000/health`
- Search: `http://localhost:3000/search?q=song+name`
- Stream by ID: `http://localhost:3000/stream?id=VIDEO_ID`
- Stream by Query: `http://localhost:3000/stream?q=song+name`
- Test Interface: `http://localhost:3000/`

## 🌐 FREE DEPLOYMENT OPTIONS

### 1. Railway (RECOMMENDED - Easiest)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect this repository
5. Railway will auto-deploy using the `railway.toml` file
6. You'll get a URL like: `https://your-app.railway.app`

### 2. Render
1. Go to https://render.com
2. Connect GitHub account
3. Create "New Web Service"
4. Connect this repo
5. Use these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`

### 3. Fly.io
```bash
# Install flyctl first
npm install -g @flyio/flyctl
flyctl auth login
flyctl launch
```

### 4. Heroku
```bash
# Install Heroku CLI first
heroku create your-app-name
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

## 🤖 DISCORD BOT INTEGRATION

Once deployed, use these URLs in your Discord bot:

```javascript
// Replace YOUR_DEPLOYED_URL with your actual URL
const API_BASE = "https://your-app.railway.app";

// Search for songs
const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(query)}`;

// Stream audio directly
const streamUrl = `${API_BASE}/stream?q=${encodeURIComponent(query)}`;

// Example Discord.js usage:
const { createAudioResource } = require('@discordjs/voice');
const resource = createAudioResource(streamUrl);
```

## 📋 DEPLOYMENT CHECKLIST

- ✅ Dependencies installed
- ✅ Server starts successfully  
- ✅ Search endpoint working
- ✅ Stream endpoints working
- ✅ Error handling implemented
- ✅ CORS enabled
- ✅ Docker support ready
- ✅ Test interface included

## 🔧 ENVIRONMENT VARIABLES

Set these on your hosting platform:
```
PORT=3000  # Usually auto-set by hosting platforms
```

## 📱 TESTING AFTER DEPLOYMENT

1. Visit `https://your-deployed-url.com/` for the test interface
2. Test the health endpoint: `https://your-deployed-url.com/health`
3. Test search: `https://your-deployed-url.com/search?q=test`
4. Test streaming: `https://your-deployed-url.com/stream?q=test`

## 💡 TIPS

- Railway offers 500 hours free per month
- Render offers unlimited static sites + 750 hours for web services
- Always test endpoints after deployment
- Monitor logs for any issues
- Keep your deployed URL secret if needed

Your API is production-ready! 🎉
