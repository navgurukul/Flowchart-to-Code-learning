# 🔧 Deployment Troubleshooting

## Current Issue: Site Not Loading at navgurukul.github.io

### Problem
The site is deploying to a Codespaces URL instead of the proper GitHub Pages URL, causing 404 errors for assets.

### Root Cause
GitHub Pages is not properly configured in repository settings.

---

## ✅ Solution Steps

### Step 1: Verify Repository is Public

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings
2. Scroll to bottom "Danger Zone"
3. Ensure repository visibility is **Public**
4. If it's Private, click "Change visibility" → "Make public"

**Why:** GitHub Pages free tier only works with public repositories.

---

### Step 2: Enable GitHub Pages Correctly

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/pages

2. You should see **"Build and deployment"** section

3. Under **"Source"**, you should see a dropdown:
   - ✅ Select: **"GitHub Actions"**
   - ❌ NOT: "Deploy from a branch"

4. Click **"Save"** if you made changes

**Screenshot of what it should look like:**
```
Build and deployment
├─ Source: [GitHub Actions ▼]  ← Select this!
└─ (No branch selection needed)
```

---

### Step 3: Manually Trigger Deployment

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/actions

2. On the left sidebar, click **"Deploy to GitHub Pages"**

3. Click the **"Run workflow"** button (top right)

4. Select branch: **main**

5. Click **"Run workflow"** (green button)

6. Wait 2-3 minutes for completion

---

### Step 4: Verify Deployment

**Check Actions:**
1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/actions
2. Look for green checkmark ✅ on latest workflow
3. Click on it to see details

**Check Pages Settings:**
1. Go back to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/pages
2. You should see: "Your site is live at https://navgurukul.github.io/Flowchart-to-Code-learning/"

**Test the Site:**
1. Open: https://navgurukul.github.io/Flowchart-to-Code-learning/
2. Should load without 404 errors
3. Check browser console (F12) - should be no errors

---

## 🐛 Common Issues & Fixes

### Issue 1: "Source" dropdown not showing "GitHub Actions"

**Fix:**
1. Make sure repository is public
2. Refresh the settings page
3. Try in a different browser
4. Check if you have admin access to the repository

### Issue 2: Workflow runs but site still shows 404

**Fix:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private window
3. Wait 5 more minutes (DNS propagation)
4. Check if workflow actually succeeded (green checkmark)

### Issue 3: Workflow fails with "Permission denied"

**Fix:**
1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/settings/actions
2. Scroll to "Workflow permissions"
3. Select: "Read and write permissions"
4. Check: "Allow GitHub Actions to create and approve pull requests"
5. Click "Save"
6. Re-run the workflow

### Issue 4: Still deploying to Codespaces URL

**Fix:**
1. Delete the `.github/workflows/pages.yml` file if it exists (we only need `deploy.yml`)
2. Go to Settings → Pages
3. If you see a custom domain or different URL, remove it
4. Set Source to "GitHub Actions"
5. Save and re-deploy

---

## 🔍 Debugging Checklist

Run through this checklist:

- [ ] Repository is **Public**
- [ ] Settings → Pages → Source is **"GitHub Actions"**
- [ ] Latest workflow run shows **green checkmark** ✅
- [ ] No errors in Actions logs
- [ ] Waited at least 5 minutes after deployment
- [ ] Tried in incognito/private browser window
- [ ] Cleared browser cache
- [ ] URL is exactly: `https://navgurukul.github.io/Flowchart-to-Code-learning/`

---

## 📊 Check Workflow Logs

If deployment fails, check the logs:

1. Go to: https://github.com/navgurukul/Flowchart-to-Code-learning/actions
2. Click on the failed workflow run
3. Click on "build" job
4. Look for red ❌ errors
5. Common errors:
   - "npm ci failed" → Delete `package-lock.json` and run `npm install` locally
   - "Build failed" → Run `npm run build` locally to see the error
   - "Permission denied" → Fix workflow permissions (see Issue 3 above)

---

## 🆘 Still Not Working?

### Option 1: Alternative Deployment Method

Try deploying from a branch instead:

1. Run locally:
```bash
npm run build
git add dist -f
git commit -m "Add dist folder"
git subtree push --prefix dist origin gh-pages
```

2. Go to Settings → Pages
3. Source: "Deploy from a branch"
4. Branch: "gh-pages" / root
5. Save

### Option 2: Use Netlify/Vercel Instead

If GitHub Pages continues to have issues:

**Netlify:**
1. Go to: https://app.netlify.com/
2. "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Deploy!

**Vercel:**
1. Go to: https://vercel.com/
2. "Add New" → "Project"
3. Import from GitHub
4. Select your repository
5. Framework: "Vite"
6. Deploy!

---

## 📞 Get Help

If you're still stuck:

1. **Check the Actions tab** for error messages
2. **Share the error logs** from the failed workflow
3. **Verify all settings** match this guide
4. **Try the alternative deployment methods** above

---

**Last Updated:** $(date)
**Status:** Troubleshooting deployment to navgurukul.github.io

