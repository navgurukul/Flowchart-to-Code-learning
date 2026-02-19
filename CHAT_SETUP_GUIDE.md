# Chat Feature Setup Guide

## Issue Identified

The chat and generate features are not working because:
1. **Backend is not running** - The FastAPI backend needs to be started
2. **Missing environment variables** - GEMINI_API_KEY is required
3. **No .env file** - Backend needs a `.env` file with API credentials

## Quick Fix Steps

### 1. Create Backend .env File

Create a file `backend/.env` with the following content:

```bash
# Gemini API Key (Required for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Credentials (Optional for local dev)
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-credentials.json
```

**To get a Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste it into the `.env` file

### 2. Install Backend Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Start the Backend Server

```bash
# Make sure you're in the backend directory
cd backend

# Activate venv if not already activated
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate  # Windows

# Start the server
uvicorn main:app --reload --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 4. Start the Frontend

In a **new terminal window**:

```bash
# Make sure you're in the project root
npm run dev
```

The frontend will run on http://localhost:5173

## Testing the Chat Feature

Once both servers are running:

1. Open http://localhost:5173 in your browser
2. Select an exercise from the Practice mode
3. Click "Open Chat" button (bottom right)
4. Try these commands:

### Chat Commands

**Learn about a topic:**
```
/learn loops
/learn variables
/learn conditional statements
```

**Generate a flowchart:**
```
/generate check if a number is even
/generate calculate factorial of a number
/generate find maximum of three numbers
```

**Regular chat:**
```
How do I use a decision node?
What's the difference between input and output?
```

## Troubleshooting

### Backend Issues

**Error: "GEMINI_API_KEY not found"**
- Make sure you created `backend/.env` file
- Check that the API key is valid
- Restart the backend server after adding the key

**Error: "Port 8000 already in use"**
```bash
# Find and kill the process using port 8000
# macOS/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Error: "Module not found"**
```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt
```

### Frontend Issues

**Error: "Failed to fetch" or "Network error"**
- Check that backend is running on http://localhost:8000
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` in frontend (defaults to localhost:8000)

**Chat button not visible:**
- Make sure you're in Practice mode (not Learn mode)
- Select an exercise first
- Check that ExerciseChat component is rendered in App.tsx

### API Key Issues

**Invalid API Key:**
1. Verify the key at https://makersuite.google.com/app/apikey
2. Make sure there are no extra spaces in the `.env` file
3. Regenerate the key if needed

**Rate Limiting:**
- Gemini API has rate limits
- Wait a few minutes and try again
- Consider upgrading your API quota

## Environment Variables

### Backend (.env in backend/)
```bash
# Required
GEMINI_API_KEY=your_key_here

# Optional (for Firebase features)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
```

### Frontend (.env in root/)
```bash
# Optional - defaults to http://localhost:8000
VITE_API_BASE_URL=http://localhost:8000
```

## Production Deployment

### Backend (Render/Railway/etc.)
Set environment variables in your hosting platform:
- `GEMINI_API_KEY` - Your Gemini API key
- `GOOGLE_APPLICATION_CREDENTIALS` - Firebase credentials (if using)

### Frontend (Vercel/Netlify/etc.)
Set environment variables:
- `VITE_API_BASE_URL` - Your backend URL (e.g., https://your-backend.onrender.com)

## Features Overview

### /learn Command
- Explains programming concepts
- Provides examples and best practices
- Context-aware based on current exercise

### /generate Command
- Creates complete flowchart solutions
- Generates nodes and edges automatically
- Provides sample inputs/outputs
- Uses structured JSON response

### Regular Chat
- Currently limited to commands only
- Future: General Q&A about exercises

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP POST
Backend (FastAPI)
    ↓ API Call
Gemini AI (Google)
    ↓ Response
Backend processes
    ↓ JSON
Frontend displays
```

## Next Steps

1. ✅ Create `backend/.env` with GEMINI_API_KEY
2. ✅ Install backend dependencies
3. ✅ Start backend server (port 8000)
4. ✅ Start frontend server (port 5173)
5. ✅ Test chat commands
6. ✅ Try generating flowcharts

## Support

If you're still having issues:
1. Check both terminal windows for error messages
2. Look at browser console (F12) for frontend errors
3. Check backend logs for API errors
4. Verify all environment variables are set correctly

Happy coding! 🚀
