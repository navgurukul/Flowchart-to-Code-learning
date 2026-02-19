# 🚀 Quick Start - Chat Feature

## Super Simple Setup (2 minutes)

### Step 1: Get API Key
Go to: https://aistudio.google.com/app/apikey
Click "Create API Key" → Copy it

### Step 2: Create .env File
In your project root, create a file named `.env`:
```bash
VITE_GEMINI_API_KEY=paste_your_key_here
```

### Step 3: Run
```bash
npm run dev
```

## Done! 🎉

Now open http://localhost:5173 and:
1. Go to **Practice** mode
2. Select an exercise
3. Click **Open Chat**
4. Try: `/generate check if number is even`

## Commands

| Command | Example | What it does |
|---------|---------|--------------|
| `/learn` | `/learn loops` | Explains concepts |
| `/generate` | `/generate factorial calculator` | Creates flowchart |
| Regular | `How do I use decision nodes?` | Answers questions |

## Troubleshooting

**Chat not working?**
- Did you create `.env` file in project root?
- Did you restart the dev server after creating .env?
- Is your API key valid?

**Still stuck?**
Read: [FRONTEND_ONLY_SETUP.md](./FRONTEND_ONLY_SETUP.md)

---

**No backend needed!** Everything runs in your browser. 🌐
