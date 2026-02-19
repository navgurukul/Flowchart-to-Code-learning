# ✅ GitHub Pages Deployment Checklist

## 🎯 Your Live URL (after setup)
**https://navgurukul.github.io/Flowchart-to-Code-learning/**

---

## 📋 Setup Steps (Do These Now!)

### ☐ Step 1: Add API Key to GitHub Secrets (2 minutes)

1. **Get your Gemini API Key:**
   - Go to: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key

2. **Add to GitHub:**
   - Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/secrets/actions
   - Click "New repository secret"
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Paste your API key
   - Click "Add secret"

### ☐ Step 2: Enable GitHub Pages (1 minute)

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/pages
2. Under "Source", select: **GitHub Actions**
3. Click "Save"

### ☐ Step 3: Watch Deployment (2-3 minutes)

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/actions
2. You should see "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (green checkmark ✅)

### ☐ Step 4: Test Your Live Site!

1. Open: https://navgurukul.github.io/Flowchart-to-Code-learning/
2. Switch to Practice mode
3. Select an exercise
4. Click "Open Chat"
5. Try: `/generate check if number is even`

---

## 🎉 Done!

Your app is now live and will auto-deploy on every push to main!

## 🔄 Future Updates

Just push to main:
```bash
git add .
git commit -m "Your changes"
git push
```

The site will automatically update in 2-3 minutes!

---

## 🐛 Troubleshooting

**Deployment failed?**
- Check: https://github.com/navgurukul/Flowchart-to-Code-learning/actions
- Look for error messages in the workflow logs

**Chat not working?**
- Did you add `VITE_GEMINI_API_KEY` secret?
- Check browser console (F12) for errors

**Need help?**
- Read: [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)

---

## 📊 Quick Links

- **Live Site:** https://navgurukul.github.io/Flowchart-to-Code-learning/
- **Repository:** https://github.com/navgurukul/Flowchart-to-Code-learning
- **Actions:** https://github.com/navgurukul/Flowchart-to-Code-learning/actions
- **Settings:** https://github.com/navgurukul/Flowchart-to-Code-learning/settings/pages
- **Secrets:** https://github.com/navgurukul/Flowchart-to-Code-learning/settings/secrets/actions
