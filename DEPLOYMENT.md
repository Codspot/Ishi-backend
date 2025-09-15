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
const { createAudioResource } = require("@discordjs/voice");
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

## 🤖 HANDLING "CONFIRM YOU'RE NOT A BOT" ISSUES

If you encounter bot detection errors:

### Available Endpoints:
- `/stream?q=song` - Standard endpoint with retry logic
- `/stream-alt?q=song` - Enhanced anti-bot detection endpoint
- `/stream-fixed` - Test endpoint with known working video

### Solutions:
1. **Use the `/stream-alt` endpoint** - Has enhanced headers
2. **Retry failed requests** - Built-in retry mechanism with exponential backoff
3. **Deploy on different servers** - Different IP addresses help
4. **Use VPS with proxy** - Set up proxy rotation if needed

### DigitalOcean Deployment with PM2:

```bash
# 1. Create droplet (Ubuntu 22.04, $5/month minimum)
ssh root@your_droplet_ip

# 2. Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs ffmpeg nginx
npm install -g pm2

# 3. Clone and setup project
git clone your_repo_url
cd ishi-backend
npm install

# 4. Start with PM2
pm2 start index.js --name "youtube-audio-api"
pm2 startup
pm2 save

# 5. Setup firewall
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw allow 3000 && ufw enable

# 6. Optional: Setup Nginx reverse proxy
# Edit /etc/nginx/sites-available/default to proxy port 3000
```

**Access your API at:** `http://your_droplet_ip:3000`

### PM2 Management:
```bash
pm2 status                    # Check status
pm2 logs youtube-audio-api    # View logs
pm2 restart youtube-audio-api # Restart service
pm2 stop youtube-audio-api    # Stop service
pm2 delete youtube-audio-api  # Remove service
```

## 💡 TIPS

- Railway offers 500 hours free per month
- Render offers unlimited static sites + 750 hours for web services
- Always test endpoints after deployment
- Monitor logs for any issues
- Keep your deployed URL secret if needed

Your API is production-ready! 🎉
