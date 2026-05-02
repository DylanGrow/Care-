# CareCompass Lite

**Mobile-first PWA for eldercare fall detection and incident reporting**

A single-developer, 24-hour MVP that runs entirely in the browser. No backend. No server. All data stored locally on your device.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/carecompass-lite.git
cd carecompass-lite

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at `http://localhost:5173` (or the next available port).

### Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to GitHub Pages (automated via Actions)
git push origin main
```

After pushing to `main`, GitHub Actions automatically builds and deploys to `https://yourusername.github.io/carecompass-lite/`

## 📱 Features

- **Fall Detection**: DeviceMotion-based fall detection with configurable sensitivity
- **Incident Reporting**: Voice (Web Speech API) or manual text incident reports
- **Risk Scoring**: Real-time risk assessment based on motion and activity patterns
- **Offline-First**: Fully functional without internet (PWA with service worker)
- **Local Storage**: All data persists in IndexedDB (no cloud sync)
- **Notifications**: Local push notifications for alerts with action buttons
- **Demo Mode**: Simulate falls and test without physical motion
- **Data Export/Import**: Backup and restore all data as JSON
- **Mobile Optimized**: Large touch targets, one-hand reach, responsive layout

## 📊 Data Model

### Event

```json
{
  "id": "evt_1234567890_abc123",
  "timestamp": 1234567890000,
  "type": "motion|interaction|notification|incident",
  "ax": 0.5,
  "ay": 0.3,
  "az": 9.8,
  "confidence": 0.85,
  "acknowledged": false,
  "exported": false,
  "metadata": {}
}
```

### Incident

```json
{
  "id": "inc_1234567890_abc123",
  "timestamp": 1234567890000,
  "source": "voice|manual|panic",
  "transcript": "I fell in the bathroom",
  "extracted": {
    "time": "2:30 pm",
    "location": "bathroom",
    "symptoms": "help, pain"
  },
  "severity": "high|medium|low|critical",
  "notified": false,
  "ack_by": null
}
```

### Schema Versioning

Current version: **1** (database version `carecompass` v1)

Migration notes for future versions will be added to `src/lib/storage.js` in the `upgrade` callback.

## 🎯 Device Compatibility Matrix

| Feature | Android Chrome | Desktop Chrome | iOS Safari | Firefox | Edge |
|---------|---|---|---|---|---|
| **Fall Detection** | ✅ Full | ✅ Full | ⚠️ Limited* | ✅ Full | ✅ Full |
| **Voice Incident** | ✅ Full | ✅ Full | ⚠️ Fallback** | ✅ Full | ✅ Full |
| **Notifications** | ✅ Full | ✅ Full | ⚠️ Limited*** | ✅ Full | ✅ Full |
| **Web Share** | ✅ Full | ✅ Full | ✅ Full | ⚠️ Fallback | ✅ Full |
| **Service Worker** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **IndexedDB** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

**Notes:**
- *iOS: DeviceMotion requires HTTPS and user permission (Settings > Privacy > Motion). Some devices block it entirely.
- **iOS: Uses manual text input if speech recognition unavailable.
- ***iOS: Uses in-app alerts instead of native notifications (Apple limitation).

## 🎮 Demo Script (6 Steps)

### Step 1: Launch & Onboarding
```
1. Open the app in your browser (or install as PWA: "Add to Home Screen")
2. Complete the 6-step onboarding tour
3. Grant permissions when prompted (Notifications, Motion, Microphone)
```

**Expected**: Home screen shows "LOW RISK" green card, panic button visible.

### Step 2: Enable Demo Mode
```
4. Go to Settings (bottom nav)
5. Scroll to "Demo Mode" → Toggle to ON
6. Return to Home
```

**Expected**: "Demo Mode" card appears below the risk card with buttons.

### Step 3: Simulate a Fall
```
7. Click "Simulate Fall" button in demo section
8. Watch the accelerometer values spike briefly in the card below
```

**Expected**: 
- App detects fall, risk score jumps to 100% (red)
- Notification appears (or browser alert): "Fall Detected!"
- Redirected to "Report Incident" screen

### Step 4: Report Incident (Voice)
```
9. On incident reporting screen, click "Start Recording" (🎤)
10. Say something like: "I fell in the bathroom, my leg hurts"
11. Let the app capture your voice for 3–5 seconds
12. Click "Stop Recording" when done
```

**Expected**:
- Transcript appears in the box
- Keywords extracted: `["fell", "leg", "hurts"]`
- Location detected: `"bathroom"`
- Severity auto-set to `"high"` (due to keywords)

### Step 5: Confirm & Save
```
13. Review the extracted information
14. Click "Confirm & Save Incident"
15. Success message: "Incident Saved" + "Emergency contacts notified"
```

**Expected**: Redirected to Home after 2s. Incident stored in IndexedDB.

### Step 6: Verify in Timeline
```
16. Go to Timeline (bottom nav)
17. See the incident at the top with severity badge
18. Tap to expand and view full details
19. Return to Settings → Export Data to download backup
```

**Expected**: Timeline shows incident, export downloads `carecompass-backup-YYYY-MM-DD.json`.

---

## ⚙️ Settings & Configuration

### Sensitivity Slider
Adjusts the acceleration threshold for fall detection (1.0–5.0g).
- **1.0g**: Very sensitive (may have false positives)
- **3.0g**: Default (balanced)
- **5.0g**: Insensitive (fewer alerts)

### Emergency Contact
Store a phone number to include in share/notification flows.

### Demo Mode
Simulates fall events and motion without physical device motion (useful for testing).

### Data Management
- **Export**: Downloads all events, incidents, and settings as JSON
- **Import**: Restores data from a previously exported backup
- **Clear All**: Wipes all local data (⚠️ irreversible)

## 🔒 Privacy & Security

### Local Storage Only
- All data stays on your device in IndexedDB
- No cloud sync, no server transmission
- Encryption (passphrase-based): Not yet implemented; marked for v2

### Permissions
- **Motion Sensor**: Required for fall detection; can be disabled in browser settings
- **Notifications**: Required for alerts; can be granted/denied at any time
- **Microphone**: Required for voice incident reporting; used locally only
- **Web Share**: Shares text/status via native share sheet (no data leaves device)

### Onboarding Privacy Notice
App displays clear privacy statement on first launch:

> **Privacy Promise:** All your health data stays on your phone. CareCompass Lite never sends anything to a server. You own your data.

## 🚨 Known Limitations

1. **iOS DeviceMotion Restricted**: Apple requires HTTPS + explicit user permission. Some devices/versions block acceleration data entirely.
2. **iOS Notifications**: Native notifications (push) unavailable; app uses in-app alerts instead.
3. **Web Speech API**: Not available in all browsers; fallback to manual text input provided.
4. **Service Worker Cache**: First visit may take longer; subsequent visits load instantly.
5. **No Real-Time Sync**: All data is local; multiple devices must export/import manually.
6. **Demo Mode Only on Home**: Fall simulations only available when Demo Mode enabled.
7. **No Cloud Backup**: Users must manually export data; no auto-sync.

## 🐛 Troubleshooting

### "Motion Sensor Not Working"
- **On Android**: Ensure Chrome has permission to access motion sensors (Settings > Permissions)
- **On iOS**: Open Settings > Safari > Motion & Orientation Access > Allow
- **Desktop**: DeviceMotion only works on real mobile devices or emulators

**Workaround**: Enable Demo Mode to test fall detection without hardware.

### "Voice Recognition Not Detected"
- **Chrome/Edge**: Supported (Web Speech API)
- **Safari**: Use manual text input (tap the input field instead of mic button)
- **Firefox**: Voice supported; may require additional permissions

**Workaround**: Always provide text input fallback.

### "Notifications Not Showing"
- **Android**: Check app permissions in Settings > Apps > CareCompass > Notifications
- **iOS**: Notifications unavailable in Safari; install as PWA for in-app alerts
- **Desktop**: Check browser notification settings

**Workaround**: Check browser console for permission denial logs.

### "App Not Installing as PWA"
- Must be served over **HTTPS** (GitHub Pages automatically uses HTTPS)
- Manifest must be valid JSON (check browser console for errors)
- Mobile browser must support PWA (Chrome/Edge/Samsung Internet)

**Test**: Open app in Chrome, tap the menu (⋮), then "Install app" or "Add to home screen".

### "Data Not Persisting"
- Browser's IndexedDB may be blocked (privacy/incognito mode)
- Check browser console for IndexedDB errors
- Try exporting/importing data to confirm storage works

**Workaround**: Disable incognito/private browsing mode.

---

## 📦 Project Structure

```
carecompass-lite/
├── src/
│   ├── components/
│   │   ├── Home.jsx              # Risk card, panic button, demo controls
│   │   ├── Timeline.jsx          # Event/incident history
│   │   ├── IncidentReporting.jsx # Voice + manual incident entry
│   │   ├── Settings.jsx          # Config, data export/import
│   │   └── Onboarding.jsx        # First-time setup tour
│   ├── lib/
│   │   ├── storage.js            # IndexedDB wrapper (idb)
│   │   ├── fallDetector.js       # Fall detection algorithm
│   │   ├── incidentReporter.js   # Web Speech + NLP for incidents
│   │   └── notifications.js      # Local notification helpers
│   ├── App.jsx                   # Main app router
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Tailwind styles
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service worker
│   ├── favicon.svg               # App icon
│   ├── icon-192.svg              # PWA icon (192x192)
│   └── icon-512.svg              # PWA icon (512x512)
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions auto-deploy
├── index.html                    # HTML entry point
├── vite.config.js                # Vite config
├── tailwind.config.js            # Tailwind config
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🛠️ Tech Stack

- **React 18**: UI framework
- **Vite**: Build tool (fast HMR, optimized bundles)
- **Tailwind CSS**: Mobile-first styling
- **idb**: IndexedDB wrapper (promises-based)
- **Web APIs**:
  - DeviceMotion (fall detection)
  - Web Speech API (voice incident reporting)
  - Notifications API (alerts)
  - Service Worker (offline caching)

## 📈 Metrics & Testing

### Unit Tests (Jest)
```bash
npm test
```

Tests cover:
- `FallDetector.processMotion()` with sample accelerometer data
- Storage migration logic
- Incident extraction (keywords, location, time)

### Fall Detection Tuning
1. Go to Home screen
2. With **Demo Mode ON**, view live sensor values in the debug card
3. Adjust the Sensitivity slider and re-run "Simulate Fall"
4. Test with real motion if device has accelerometer

### Sample Data
- `demos/sample-events.json`: 50 motion events
- `demos/sample-incidents.json`: 10 incident reports
- `demos/audio-transcript.txt`: Sample voice transcript

Import via Settings > Import Data to test timeline and export flows.

---

## 📝 Permissions Text (Onboarding)

### Motion Sensor
> We monitor your phone's motion to detect potential falls. This helps us alert you quickly if we suspect a fall event. You can disable this in settings or your device's permission manager.

### Notifications
> We'll send you alerts for fall detections and incidents. You can customize notification settings in your device's settings at any time.

### Microphone
> When you report an incident, we use your phone's microphone to capture your voice. All audio is processed locally on your device—nothing is sent to a server.

### Location (Web Share)
> When you share your status with emergency contacts, we include your last known general location if available. This is optional and happens only when you explicitly tap "Share."

---

## 🚀 Deployment

### GitHub Pages Setup

1. **Create GitHub repo** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/carecompass-lite.git
   git push -u origin main
   ```

2. **Enable GitHub Pages** in repo settings:
   - Settings > Pages > Source: "GitHub Actions"
   - (Actions workflow will auto-deploy `dist/` to `gh-pages` branch)

3. **Access the live app**:
   - `https://yourusername.github.io/carecompass-lite/`

4. **Customize domain** (optional):
   - Add a `CNAME` file in `public/` with your domain
   - Update DNS CNAME to point to GitHub Pages

---

## 🎓 API Examples

### Save an Event
```javascript
import { saveEvent } from './lib/storage';

const eventId = await saveEvent({
  type: 'motion',
  timestamp: Date.now(),
  ax: 0.5,
  ay: 0.3,
  az: 9.8,
  confidence: 0.85,
  metadata: { source: 'devicemotion' }
});
```

### Save an Incident
```javascript
import { saveIncident } from './lib/storage';

const incidentId = await saveIncident({
  timestamp: Date.now(),
  source: 'voice',
  transcript: 'I fell in the bathroom',
  extracted: { location: 'bathroom', symptoms: 'pain' },
  severity: 'high',
  notified: false
});
```

### Detect a Fall
```javascript
import { FallDetector } from './lib/fallDetector';

const detector = new FallDetector({ accelThreshold: 3.0 });
const result = detector.processMotion(ax, ay, az);

if (result?.type === 'fall_candidate') {
  console.log(`Fall detected with confidence: ${result.confidence}`);
}
```

### Export Data
```javascript
import { exportData } from './lib/storage';

const backup = await exportData();
console.log(backup); // { version, exportDate, events, incidents, settings }
```

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

This is a 24-hour MVP. Future enhancements:
- [ ] Passphrase-based local encryption
- [ ] Multi-device sync via cloud (Firebase/Supabase)
- [ ] Advanced ML-based fall detection
- [ ] Audio/video capture for incidents
- [ ] Emergency contact auto-call (with permission)
- [ ] Integration with medical alert services

---

## 📞 Support

For issues, questions, or feature requests, please open a GitHub issue.

---

**Built with ❤️ for eldercare. All data stays with you.**
