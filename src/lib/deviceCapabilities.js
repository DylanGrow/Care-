// Detect what sensors and APIs are available on this device
export const detectCapabilities = () => {
  const caps = {
    // Sensors
    motionSensor: 'DeviceMotionEvent' in window,
    gyroscope: false, // Will be set to true if rotationRate is available
    barometer: false,
    
    // APIs
    speechRecognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    notifications: 'Notification' in window,
    webShare: Boolean(navigator.share),
    vibration: Boolean(navigator.vibrate),
    geolocation: Boolean(navigator.geolocation),
    indexedDB: Boolean(window.indexedDB),
    serviceWorker: Boolean('serviceWorker' in navigator),
    
    // Platform
    isAndroid: /Android/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isDesktop: !/Android|iPhone|iPad|iPod|Mobile/.test(navigator.userAgent),
    
    // Browser
    isChrome: /Chrome/.test(navigator.userAgent),
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isFirefox: /Firefox/.test(navigator.userAgent),
    isEdge: /Edg/.test(navigator.userAgent),
    
    // Limitations
    limitations: []
  };

  // Detect gyroscope by trying to use it
  if (window.DeviceMotionEvent) {
    const handler = (event) => {
      if (event.rotationRate?.alpha !== undefined) {
        caps.gyroscope = true;
      }
      window.removeEventListener('devicemotion', handler);
    };
    window.addEventListener('devicemotion', handler, { once: true });
  }

  // iOS limitations
  if (caps.isIOS) {
    caps.limitations.push('DeviceMotion API is restricted on iOS');
    caps.limitations.push('Speech recognition has limited support');
    caps.limitations.push('Background notification is limited');
    
    if (!/iPhone|iPad/.test(navigator.userAgent)) {
      caps.motionSensor = false;
    }
  }

  // Desktop limitations
  if (caps.isDesktop) {
    caps.limitations.push('Fall detection only works with compatible sensors');
    caps.limitations.push('Demo mode recommended for testing');
  }

  // Browser-specific limitations
  if (caps.isSafari && !caps.isIOS) {
    // Safari on Mac
    caps.limitations.push('Safari has limited device motion support');
  }

  return caps;
};

// Get recommendation based on capabilities
export const getDeviceRecommendation = (capabilities) => {
  if (capabilities.isAndroid && capabilities.motionSensor && capabilities.speechRecognition) {
    return {
      level: 'excellent',
      message: 'This device is fully supported for all features',
      demandemoMode: false
    };
  }

  if (capabilities.motionSensor && capabilities.speechRecognition) {
    return {
      level: 'good',
      message: 'Most features are supported',
      suggestDemoMode: false
    };
  }

  if (capabilities.motionSensor || capabilities.speechRecognition) {
    return {
      level: 'partial',
      message: 'Some features are limited. Demo mode recommended for testing.',
      suggestDemoMode: true
    };
  }

  return {
    level: 'limited',
    message: 'Device has limited sensor support. Please use demo mode.',
    suggestDemoMode: true
  };
};

// Check if browser supports critical features
export const canRunApp = (capabilities) => {
  // Must have IndexedDB to store data
  if (!capabilities.indexedDB) {
    return {
      canRun: false,
      reason: 'IndexedDB is required but not available on this browser'
    };
  }

  return { canRun: true };
};
