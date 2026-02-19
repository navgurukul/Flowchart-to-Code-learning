# 🚀 GitHub Pages Deployment Guide

Your app is now configured to automatically deploy to GitHub Pages!

## 🎯 Live URL (after setup)
Your app will be available at:
**https://navgurukul.github.io/Flowchart-to-Code-learning/**

## ⚙️ Setup Steps (One-time)

### Step 1: Add Gemini API Key to GitHub Secrets

1. Go to your GitHub repository: https://github.com/navgurukul/Flowchart-to-Code-learning
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Secret:** Your Gemini API key (get from https://aistudio.google.com/app/apikey)
6. Click **Add secret**

### Step 2: Enable GitHub Pages

1. Still in **Settings**, scroll down to **Pages** (left sidebar)
2. Under **Source**, select:
   - Source: **GitHub Actions**
3. Click **Save**

### Step 3: Push Changes (Trigger Deployment)

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push
```

## ✅ That's It!

The deployment will start automatically. You can watch the progress:
1. Go to the **Actions** tab in your GitHub repo
2. You'll see "Deploy to GitHub Pages" workflow running
3. Wait 2-3 minutes for it to complete
4. Your app will be live at: https://navgurukul.github.io/Flowchart-to-Code-learning/

## 🔄 Automatic Deployments

From now on, every time you push to the `main` branch:
- GitHub Actions will automatically build your app
- Deploy it to GitHub Pages
- Your live site will update in 2-3 minutes

## 🧪 Testing Locally Before Deploy

Always test locally first:
```bash
# Build the production version
npm run build

# Preview the production build
npm run preview
```

Then open http://localhost:4173 to test.

## 🐛 Troubleshooting

### Deployment Failed?

**Check the Actions tab:**
1. Go to https://github.com/navgurukul/Flowchart-to-Code-learning/actions
2. Click on the failed workflow
3. Check the error logs

**Common Issues:**

**1. "VITE_GEMINI_API_KEY is not set"**
- Make sure you added the secret in Step 1
- Secret name must be exactly: `VITE_GEMINI_API_KEY`

**2. "Pages not enabled"**
- Go to Settings → Pages
- Make sure Source is set to "GitHub Actions"

**3. "Build failed"**
- Check if `npm run build` works locally
- Look at the error in Actions logs

**4. "404 Page Not Found"**
- Wait 5 minutes after first deployment
- Clear browser cache
- Check if base path is correct in vite.config.ts

### Chat Not Working on GitHub Pages?

**Check:**
1. Did you add `VITE_GEMINI_API_KEY` to GitHub Secrets?
2. Open browser console (F12) for errors
3. Verify API key is valid at https://aistudio.google.com/app/apikey

### Assets Not Loading?

If CSS/JS files show 404:
- Check that `base: '/Flowchart-to-Code-learning/'` is in vite.config.ts
- Rebuild and redeploy

## 📊 Monitoring

**View Deployment Status:**
- Actions tab: https://github.com/navgurukul/Flowchart-to-Code-learning/actions
- Pages settings: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/pages

**Check Live Site:**
- Main URL: https://navgurukul.github.io/Flowchart-to-Code-learning/
- Should load in 2-3 minutes after push

## 🔒 Security Notes

**API Key Security:**
- ✅ API key is stored as GitHub Secret (encrypted)
- ✅ Only accessible during build process
- ⚠️ API key will be in the built JavaScript (visible in browser)
- 🛡️ Recommended: Restrict API key to your domain in Google Cloud Console

**To Restrict API Key:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your API key
3. Click "Edit"
4. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `navgurukul.github.io/*`
5. Save

## 🎨 Custom Domain (Optional)

Want to use your own domain?

1. In Settings → Pages, add your custom domain
2. Update `base: '/'` in vite.config.ts (remove the repo name)
3. Add CNAME record in your DNS settings
4. Redeploy

## 📝 Workflow File

The deployment is configured in `.github/workflows/deploy.yml`

**What it does:**
1. Triggers on every push to `main`
2. Installs dependencies
3. Builds the app with your API key
4. Deploys to GitHub Pages

**Manual Trigger:**
You can also trigger deployment manually:
1. Go to Actions tab
2. Click "Deploy to GitHub Pages"
3. Click "Run workflow"

## 🚀 Next Steps

1. ✅ Add `VITE_GEMINI_API_KEY` to GitHub Secrets
2. ✅ Enable GitHub Pages in Settings
3. ✅ Push this commit to trigger deployment
4. ✅ Wait 2-3 minutes
5. ✅ Visit https://navgurukul.github.io/Flowchart-to-Code-learning/
6. ✅ Test the chat feature
7. ✅ Share with your team!

## 📞 Need Help?

If you encounter issues:
1. Check the Actions tab for build logs
2. Review this guide again
3. Test locally with `npm run build && npm run preview`
4. Check browser console for errors

Happy deploying! 🎉
