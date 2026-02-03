# Lens Race - Image Navigation Game

A web-based image navigation game using Google Vision API with full image search and crop (Lens) functionality.

## Quick Deploy to Railway (Free)

1. Push this code to GitHub
2. Go to https://railway.app
3. Click "Deploy from GitHub"
4. Select this repository
5. Railway will auto-deploy
6. You'll get a URL like: `https://your-app.railway.app`

## Quick Deploy to Render (Free)

1. Push this code to GitHub
2. Go to https://render.com
3. Click "New Web Service"
4. Connect your GitHub repository
5. Render will auto-deploy
6. You'll get a URL like: `https://your-app.onrender.com`

## Local Testing

```bash
cd backend
npm install
npm start
```

Then open http://localhost:3000

## How to Use

1. Visit the deployed URL
2. Enter your Google Cloud Vision API key
3. Click "Start Game"
4. Navigate through images using:
   - **Click** anywhere on image to search full image
   - **Crop & Search** button to drag and select a region

## Getting a Google Vision API Key

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Cloud Vision API
4. Go to Credentials → Create API Key
5. Restrict the key to Cloud Vision API only

## File Structure

```
backend/
├── server.js          # Express backend
├── package.json       # Dependencies
├── public/
│   └── index.html     # Frontend game interface
└── railway.json       # Deploy config
```

## API Costs

- First 1,000 Vision API calls/month: FREE
- After that: $1.50 per 1,000 calls
- Average game uses 5-10 API calls

## Features

- ✅ Full image search (click anywhere)
- ✅ Crop search (Lens-style zoom on details)
- ✅ Real-time visual similarity detection
- ✅ Label detection (see what's in the image)
- ✅ Hop counter
- ✅ Works on any device
