# Frontend-Only Setup (No Backend Needed!)

The chat feature now works directly from the browser using Gemini's API - no backend server required! 🎉

## Quick Setup (2 Steps)

### 1. Get a Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

### 2. Create .env File

Create a file named `.env` in the project root (same level as package.json):

```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

Replace `your_actual_api_key_here` with the key you copied.

### 3. Start the App

```bash
npm install  # If you haven't already
npm run dev
```

That's it! The chat feature will now work directly in your browser.

## Testing the Chat

1. Open http://localhost:5173
2. Switch to **Practice** mode (not Learn mode)
3. Select any exercise
4. Click "Open Chat" button (bottom right)
5. Try these commands:

### Learn Command
```
/learn loops
/learn variables
/learn decision nodes
```

### Generate Command
```
/generate check if a number is even
/generate calculate factorial
/generate find maximum of three numbers
```

### Regular Chat
```
How do I use a loop node?
What's the difference between process and decision?
```

## How It Works

```
Your Browser
    ↓
Gemini API (Direct HTTPS call)
    ↓
AI Response
    ↓
Display in Chat
```

No backend server needed! Everything runs in your browser.

## Troubleshooting

### "VITE_GEMINI_API_KEY is not set"

**Solution:**
1. Make sure you created `.env` file in the project root (not in src/)
2. Check that the file is named exactly `.env` (not `.env.txt`)
3. Restart the dev server after creating/editing .env:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev  # Start again
   ```

### "Gemini API error: API key not valid"

**Solution:**
1. Verify your API key at https://aistudio.google.com/app/apikey
2. Make sure there are no extra spaces in the .env file
3. Try regenerating the API key

### "Failed to fetch" or CORS error

**Solution:**
- This shouldn't happen with direct Gemini API calls
- Check your internet connection
- Verify the API key is correct

### Chat button not visible

**Solution:**
- Make sure you're in **Practice mode** (not Learn mode)
- Select an exercise first
- The chat button appears in the bottom right corner

## Environment Variables

Only one variable is needed:

```bash
# Required for chat features
VITE_GEMINI_API_KEY=your_key_here
```

**Note:** Variables starting with `VITE_` are exposed to the browser. Never commit your `.env` file to git!

## Security Note

⚠️ **Important:** The API key is exposed in the browser. For production:

1. **Option 1:** Use API key restrictions in Google Cloud Console:
   - Restrict to your domain only
   - Set usage quotas
   - Monitor usage

2. **Option 2:** Use a backend proxy (the backend/ folder code) to hide the key

For learning/development purposes, the direct approach is fine!

## Features

### /learn Command
- Explains programming concepts
- Provides code examples
- Context-aware based on current exercise
- Markdown formatted responses

### /generate Command
- Creates complete flowcharts automatically
- Generates nodes and edges
- Proper positioning and connections
- Works with any description

### Regular Chat
- Ask questions about flowcharts
- Get help with exercises
- Learn programming concepts

## Cost

Gemini API has a generous free tier:
- 15 requests per minute
- 1 million tokens per day
- 1500 requests per day

Perfect for learning and development!

## What Changed

**Before:** Frontend → Backend (FastAPI) → Gemini API
**Now:** Frontend → Gemini API (direct)

Benefits:
- ✅ No backend server to run
- ✅ Simpler setup
- ✅ Faster responses
- ✅ Easier deployment
- ✅ Works on any static host (Vercel, Netlify, etc.)

## Deployment

### Vercel/Netlify/GitHub Pages

1. Add `VITE_GEMINI_API_KEY` to your hosting platform's environment variables
2. Deploy normally
3. Chat works automatically!

### Example (Vercel)
```bash
vercel env add VITE_GEMINI_API_KEY
# Paste your API key when prompted
vercel deploy
```

## Next Steps

1. ✅ Create `.env` file with your Gemini API key
2. ✅ Run `npm run dev`
3. ✅ Test the chat commands
4. ✅ Try generating flowcharts
5. ✅ Learn and practice!

Happy coding! 🚀
