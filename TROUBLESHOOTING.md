# CareCompass Lite — Troubleshooting Guide

## Browser & Device Issues

### Fall Detection Not Working

**Symptom**: Acceleration values show 0, "Simulate Fall" doesn't trigger detection.

**Causes & Solutions**:
1. **Device doesn't have accelerometer**
   - Desktop computers and many laptops lack motion sensors
   - **Solution**: Test on a real mobile device or use emulator with motion support
   - Chrome DevTools: Right-click > Inspect > Sensors tab (can simulate motion)

2. **Browser doesn't support DeviceMotionEvent**
   - Check Settings > Device Compatibility
   - **Solution**: Use Chrome, Firefox, or Edge on Android
   - iOS Safari: Limited support; may require HTTPS and explicit permission

3. **Permission denied at OS level**
   - **Android**: Settings > Apps > CareCompass > Permissions > Motion Sensors
   - **iOS**: Settings > Privacy > Motion & Fitness > Allow for Safari
   - **Solution**: Grant motion sensor permission and reload app

4. **Threshold too high**
   - Default is 3.0g; if set to 5.0g, requires very sudden motion
   - **Solution**: Go to Home > Sensitivity slider, lower the threshold and retry

---

### Voice Incident Reporting Not Working

**Symptom**: Clicking mic button does nothing, or "Web Speech API not supported" message.

**Causes & Solutions**:
1. **Browser doesn't support Web Speech API**
   - Supported in: Chrome, Edge, Safari (newer versions)
   - Not supported: Firefox, some versions of Safari on iOS
   - **Solution**: Use Chrome on Android, or manually type incident instead of voice

2. **Microphone permission denied**
   - **Browser level**: Check browser's permission popup; click "Allow"
   - **OS level**: Settings > Privacy > Microphone > Allow the browser
   - **Solution**: Grant permission and reload app

3. **Microphone hardware issue**
   - Device mic may be muted or malfunctioning
   - **Test**: Try voice call, video app, or voice assistant
   - **Solution**: Check device audio settings or test on another device

4. **Fallback to text not available**
   - App should always show text input field as fallback
   - **Solution**: If mic fails, manually type your incident report

---

### Notifications Not Showing

**Symptom**: No alerts appear when fall is detected or incident reported.

**Causes & Solutions**:
1. **Notification permission not granted**
   - App should ask on first launch or when needed
   - **Check**: Settings > Device Compatibility > Notifications
   - **Solution**: Go to Settings tab > check if notifications enabled; reload if needed

2. **Browser notifications blocked**
   - **Chrome**: Address bar > lock icon > Notifications > Allow
   - **Firefox**: Preferences > Privacy > Permissions > Notifications > Allow
   - **Safari/iOS**: Settings > Notifications > [App Name] > Allow
   - **Solution**: Grant notification permission in browser settings

3. **Phone notifications silenced**
   - Device may be in Do Not Disturb or silent mode
   - **Solution**: Check device notification settings; disable silent mode

4. **iOS Safari limitation**
   - Native notifications unavailable in Safari on iOS
   - **Solution**: Install app as PWA (Add to Home Screen); in-app alerts will show instead

---

### Data Not Saving / Loss on Refresh

**Symptom**: Events and incidents disappear after closing app or refreshing browser.

**Causes & Solutions**:
1. **IndexedDB blocked (Incognito/Private Mode)**
   - Incognito browsing disables persistent storage in many browsers
   - **Solution**: Use regular (non-incognito) browsing mode

2. **Browser cache/cookies cleared automatically**
   - Some privacy tools delete IndexedDB on exit
   - **Solution**: 
     - Disable privacy extensions for the app's domain
     - Check browser settings: History > Clear browsing data (uncheck IndexedDB)

3. **Browser doesn't support IndexedDB**
   - Very old browsers may lack IndexedDB support
   - **Solution**: Upgrade to modern browser (Chrome, Firefox, Edge, Safari)

4. **Storage quota exceeded**
   - Device storage full; browser cannot allocate more space for IndexedDB
   - **Solution**: 
     - Export data (Settings > Export Data) before clearing browser storage
     - Free up device storage
     - Clear browser cache (not IndexedDB)

**Recovery**:
- If data lost, check if you have a backup JSON file
- Settings > Import Data > select saved backup file

---

## Feature Limitations

### iOS Motion Sensor Issues

**Symptom**: Fall detection works on Android but not on iPhone/iPad.

**Why**: Apple restricts access to accelerometer data for privacy and security.

**Solutions**:
1. **Enable Motion & Orientation permission**
   - Settings > Privacy > Motion & Fitness > Enable
   - **Note**: Must do this BEFORE opening app; permissions sticky

2. **Use HTTPS only**
   - App must be served over HTTPS; HTTP blocked for sensor access
   - GitHub Pages uses HTTPS automatically (OK)

3. **Some iOS versions/devices block completely**
   - iPhone 6s and older, or iOS versions < 13.3, may not support
   - **Workaround**: Use Demo Mode to test fall detection without hardware

---

### Service Worker Not Caching

**Symptom**: App still requires internet on second visit; caching not working.

**Causes & Solutions**:
1. **Service Worker registration failed**
   - Check browser console for errors
   - Must be served over HTTPS
   - **Solution**: Reload page; check console for "Service Worker registered"

2. **Manifest path incorrect**
   - If app hosted at `username.github.io/carecompass-lite/`, paths must include `/carecompass-lite/`
   - **Fix**: Check `vite.config.js` > `base: '/carecompass-lite/'`
   - **Solution**: Rebuild and redeploy

3. **Browser privacy settings block service workers**
   - Some privacy tools disable SW
   - **Solution**: Whitelist app domain in privacy extensions

**Verify**:
- Open DevTools > Application > Service Workers
- Should show "active" status
- Try disabling network (DevTools > Network tab > Offline) and reload

---

## GitHub Pages Deployment Issues

### App Shows 404 After Deploy

**Symptom**: GitHub Actions build succeeds, but app shows "Not Found".

**Causes & Solutions**:
1. **Repository name in path mismatch**
   - If repo is `carecompass-lite`, URL should be `.../carecompass-lite/`
   - If repo is personal site (e.g., `username.github.io`), URL is `.../` (root)
   - **Fix**: Check `vite.config.js` > `base:` matches actual deployment path

2. **GitHub Pages not enabled**
   - Settings > Pages > Source should be "GitHub Actions"
   - **Solution**: Enable GitHub Pages and re-run workflow

3. **gh-pages branch not created**
   - First deploy may not create `gh-pages` branch automatically
   - **Solution**: Run build locally (`npm run build`), or manually create branch

---

### Blank Page After Deployment

**Symptom**: App deploys but shows blank white page.

**Causes & Solutions**:
1. **Base path mismatch**
   - Service worker or manifest paths don't match deployment folder
   - **Fix**: Ensure `vite.config.js` `base` setting is correct:
     ```javascript
     base: '/carecompass-lite/',  // if hosted at yourusername.github.io/carecompass-lite
     base: '/',                    // if hosted at yourusername.github.io (personal site)
     ```

2. **Build errors not visible**
   - Check GitHub Actions logs: Repository > Actions > latest workflow
   - Look for errors in "Build" step
   - **Solution**: Fix errors in code and re-push

3. **React component rendering issue**
   - Check browser console for JavaScript errors
   - Look for React-specific errors
   - **Solution**: Fix errors in component code

**Debug**:
```bash
npm run build
npm run preview
# Visit localhost URL shown; check console for errors
```

---

## Performance Issues

### App Slow to Load

**Symptom**: Onboarding or home page takes >3 seconds to display.

**Causes & Solutions**:
1. **Service worker background work**
   - First-time install caches resources
   - **Solution**: Patience; subsequent loads are instant

2. **Large IndexedDB**
   - Too many events accumulated (thousands of records)
   - **Solution**: 
     - Settings > Clear All Data to reset
     - Or export and archive old backups

3. **Browser performance**
   - Device may have low RAM or old CPU
   - **Solution**: Close background apps; restart device

---

## Data Export/Import Issues

### Export File Too Large

**Symptom**: Downloaded JSON file is several MB; takes long to import.

**Solution**: 
- This is normal; events accumulate over time
- Periodically export and archive old backups
- Settings > Clear All Data if needed to reset

### Import Fails with "Invalid File"

**Symptom**: "Invalid backup file or import failed" error.

**Causes & Solutions**:
1. **Corrupted JSON**
   - File may have been edited or corrupted
   - **Solution**: Check file in text editor; ensure it's valid JSON

2. **Wrong file format**
   - Not a CareCompass backup file
   - **Solution**: Use only files exported from Settings > Export Data

3. **Browser file read permission**
   - Some privacy browsers block file input
   - **Solution**: Allow file picker in browser settings

---

## Contact & Further Help

- **GitHub Issues**: Open a bug report or feature request
- **Browser Console**: Press F12 > Console for error messages
- **Privacy**: All data stays on your device; no telemetry sent

---

**Last Updated**: May 2024  
**App Version**: 1.0.0
