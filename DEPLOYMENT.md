# Deployment Guide — CareCompass Lite to GitHub Pages

## One-Click Deploy (Automated via GitHub Actions)

### 1. Create GitHub Repository

```bash
# If not already on GitHub
git init
git add .
git commit -m "Initial commit: CareCompass Lite MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/carecompass-lite.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Settings > Pages
3. **Source**: Select "GitHub Actions"
4. **Save**

That's it! The workflow file (`.github/workflows/deploy.yml`) will automatically trigger.

### 3. Watch the Deployment

1. Go to your repo > Actions
2. Look for "Build and Deploy to GitHub Pages" workflow
3. Click the latest run to see status
4. When it shows a ✅ green checkmark, your app is live

### 4. Access Your Live App

- **If repo is named `carecompass-lite`**:  
  `https://YOUR_USERNAME.github.io/carecompass-lite/`

- **If repo is named `YOUR_USERNAME.github.io` (personal site)**:  
  `https://YOUR_USERNAME.github.io/`

---

## Manual Deployment (If Actions Fails)

### Build Locally

```bash
npm install
npm run build
```

This creates a `dist/` folder with the production build.

### Deploy via Git

```bash
# Option A: Push to gh-pages branch manually
npm run build
git add dist -f  # Force-add dist folder
git commit -m "Deploy production build"
git subtree push --prefix dist origin gh-pages

# Option B: Use a deployment tool (optional)
npm install -g gh-pages
gh-pages -d dist
```

---

## Verify Deployment

### Check Service Worker

1. Open your live app in Chrome
2. Press F12 (DevTools) > Application > Service Workers
3. Should show "Service Worker" with "active" status

### Check Manifest

1. Press F12 > Application > Manifest
2. Should show PWA metadata (name, icons, etc.)

### Test Offline Mode

1. DevTools > Network tab
2. Check "Offline" checkbox
3. Reload page
4. App should still load (served from cache)

---

## Troubleshooting Deployment

### Workflow Fails with "Build Error"

1. Check workflow logs: Actions > latest run > Build step
2. Look for error messages
3. Common issues:
   - Missing `npm install`: Shouldn't happen (workflow installs)
   - Node version mismatch: Update `.github/workflows/deploy.yml` > `node-version`
   - Port conflict: Shouldn't affect build, but check local `npm run build`

### App Shows Blank Page

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md#blank-page-after-deployment)

### Slow Deployment

First deployment can take 2–5 minutes. Subsequent deployments are faster.

---

## Custom Domain (Optional)

### Add Custom Domain to GitHub Pages

1. **Buy a domain** (Namecheap, GoDaddy, Google Domains, etc.)

2. **Configure DNS**
   - If `carecompass-lite` repo:  
     Add `CNAME` record:
     ```
     carecompass-lite.your-domain.com  CNAME  username.github.io.
     ```
   - If personal site repo (`username.github.io`):  
     Add `A` record:
     ```
     your-domain.com  A  185.199.108.153
     ```
     (or other GitHub Pages IP; check GitHub docs)

3. **Update vite.config.js** (if needed)
   ```javascript
   export default defineConfig({
     base: '/',  // Root domain, no subfolder
     // ...
   })
   ```

4. **Create CNAME file** in `public/`
   ```bash
   echo "carecompass-lite.your-domain.com" > public/CNAME
   ```

5. **Push and re-deploy**
   ```bash
   git add public/CNAME
   git commit -m "Add custom domain"
   git push origin main
   ```

6. **Verify in GitHub Settings**
   - Settings > Pages > Custom domain
   - Should show your domain with a green checkmark

---

## Environment Variables (Not Needed for MVP)

CareCompass Lite is fully client-side, so no `.env` files are needed. If you add backend services in future:

```bash
# .env.local (not committed)
VITE_API_URL=https://api.example.com
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## Performance Tips

### Reduce Build Size

Current bundle is ~200KB gzipped. To keep it small:
- Don't add large dependencies
- Use Vite's built-in tree-shaking
- Monitor build size: `npm run build` shows size info

### Cache Strategy

Service worker caches:
- HTML, CSS, JS (all assets)
- Cache busted automatically on new deploy

Users get latest version within a few seconds of app reload.

---

## Rollback (If Deploy Goes Wrong)

### Revert to Previous Deployment

1. Go to repo > Settings > Pages > GitHub Actions
2. Find the previous successful workflow run
3. The `gh-pages` branch still has the old build
4. Either:
   - Re-run the workflow on an earlier commit: Go to Actions, select workflow, click "Re-run jobs"
   - Or manually push an older version to `gh-pages` branch

---

## Next Steps

1. **Install as PWA**:
   - Open app on mobile Chrome/Edge
   - Tap menu (⋮) > Install app
   - Or long-press > Add to Home Screen

2. **Share the link**:
   - Send `https://YOUR_USERNAME.github.io/carecompass-lite/` to users
   - Works on any device with a modern browser

3. **Collect feedback**:
   - Use the app in demo mode
   - Test on real devices
   - Gather feedback for v2 improvements

4. **Future improvements**:
   - Add cloud backup (Firebase/Supabase)
   - Implement local encryption
   - Integrate with medical alert services

---

## Support

- **Deployment issues?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Actions docs**: https://docs.github.com/en/actions
- **GitHub Pages docs**: https://docs.github.com/en/pages

---

**Deployed with ❤️ from GitHub Actions**
