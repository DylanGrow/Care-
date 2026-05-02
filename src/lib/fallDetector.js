export class FallDetector {
  constructor(options = {}) {
    this.accelThreshold = options.accelThreshold || 2.5;
    this.gyroThreshold = options.gyroThreshold || 180; // deg/s
    this.postFallInactivity = options.postFallInactivity || 3000; // 3s of stillness after spike
    this.debounceMs = options.debounceMs || 8000;
    this.confirmationWindow = options.confirmationWindow || 5000; // time to confirm fall
    
    this.lastMotion = Date.now();
    this.lastDetectionTime = 0;
    this.spikeDetected = false;
    this.spikeStartTime = 0;
    this.spikeResultant = 0;
    this.postSpikeLowMovement = 0;
    this.recentAccels = []; // rolling window for variance
    this.maxWindowSize = 20;
    this.fallCandidateTime = null;
  }

  computeResultant(ax, ay, az) {
    return Math.sqrt(ax * ax + ay * ay + az * az);
  }

  // Detect sudden direction change (using gyroscope if available)
  computeAngularVelocity(gx, gy, gz) {
    if (!gx || !gy || !gz) return 0;
    return Math.sqrt(gx * gx + gy * gy + gz * gz);
  }

  // Check if device orientation suggests person is down (prone/supine)
  isDeviceDown(alpha, beta, gamma) {
    if (alpha === undefined || beta === undefined) return false;
    
    // If device is mostly flat/tilted significantly from upright, person might be down
    // Beta near ±90 = device perpendicular to ground (person standing)
    // Beta near 0/180 = device parallel to ground (person lying)
    const betaAbs = Math.abs(beta);
    return betaAbs < 45 || betaAbs > 135; // Device roughly horizontal
  }

  // Variance of recent acceleration (stability check)
  computeAccelVariance() {
    if (this.recentAccels.length < 5) return 0;
    
    const mean = this.recentAccels.reduce((a, b) => a + b, 0) / this.recentAccels.length;
    const variance = this.recentAccels.reduce((sum, val) => sum + (val - mean) ** 2, 0) / this.recentAccels.length;
    return Math.sqrt(variance);
  }

  // Main processing function with multi-stage validation
  processMotion(ax, ay, az, gx = 0, gy = 0, gz = 0, alpha, beta, gamma) {
    const resultant = this.computeResultant(ax, ay, az);
    const angularVel = this.computeAngularVelocity(gx, gy, gz);
    const now = Date.now();
    
    // Track acceleration history
    this.recentAccels.push(resultant);
    if (this.recentAccels.length > this.maxWindowSize) {
      this.recentAccels.shift();
    }
    
    // Update last motion time (threshold to ignore noise)
    if (resultant > 0.5) {
      this.lastMotion = now;
    }

    const timeSinceLastDetection = now - this.lastDetectionTime;

    // STAGE 1: Detect sudden spike (acceleration OR angular velocity)
    const hasAccelSpike = resultant > this.accelThreshold;
    const hasAngularSpike = angularVel > this.gyroThreshold;
    const isSpikeEvent = hasAccelSpike || hasAngularSpike;

    if (isSpikeEvent && !this.spikeDetected && timeSinceLastDetection > this.debounceMs) {
      this.spikeDetected = true;
      this.spikeStartTime = now;
      this.spikeResultant = resultant;
      this.postSpikeLowMovement = 0;
      
      return {
        type: 'spike_detected',
        resultant,
        angularVel,
        isGyroBased: hasAngularSpike,
        time: now,
        confidence: 0.3 // Low confidence, needs validation
      };
    }

    // STAGE 2: Validate spike with post-fall stillness
    if (this.spikeDetected) {
      const timeSinceSpike = now - this.spikeStartTime;
      const stillness = this.computeAccelVariance();
      
      // Track consecutive low-movement samples
      if (resultant < 1.5 && stillness < 0.8) {
        this.postSpikeLowMovement += 100; // ms
      } else {
        this.postSpikeLowMovement = 0; // Reset if movement detected
      }

      // If we have both spike + sustained inactivity = likely fall
      if (this.postSpikeLowMovement >= this.postFallInactivity && timeSinceSpike > 500) {
        const confidence = Math.min(0.95, 0.5 + (this.postSpikeLowMovement / this.postFallInactivity) * 0.3);
        
        // Check device orientation if available
        const deviceDownIndicator = this.isDeviceDown(alpha, beta, gamma) ? 0.15 : 0;
        const finalConfidence = Math.min(1, confidence + deviceDownIndicator);
        
        this.fallCandidateTime = now;
        this.spikeDetected = false;
        this.lastDetectionTime = now;
        
        return {
          type: 'fall_confirmed',
          resultant: this.spikeResultant,
          postFallStillnessMs: this.postSpikeLowMovement,
          variance: stillness,
          confidence: finalConfidence,
          time: now,
          requiresConfirmation: finalConfidence < 0.7 // User must confirm if low confidence
        };
      }

      // Timeout: no confirmation within window = false positive
      if (timeSinceSpike > this.confirmationWindow) {
        this.spikeDetected = false;
        return { type: 'spike_timeout', time: now };
      }
    }

    return null;
  }

  // Manual fall confirmation (user or caregiver)
  confirmFall(confidence = 0.9) {
    this.lastDetectionTime = Date.now();
    this.spikeDetected = false;
    return {
      type: 'fall_confirmed_manual',
      confidence,
      time: Date.now()
    };
  }

  checkInactivity(lastActivityTime, threshold = 12 * 60 * 60 * 1000) {
    const now = Date.now();
    const inactiveMs = now - lastActivityTime;
    return inactiveMs > threshold;
  }

  checkNightActivity(hour, start = 23, end = 6) {
    return hour >= start || hour < end;
  }
}

export const createDemoMotionSequence = () => {
  return [
    { ax: 0.1, ay: 0.2, az: 1.0, delay: 100 },
    { ax: 0.2, ay: 0.3, az: 1.1, delay: 100 },
    { ax: 4.5, ay: 3.2, az: 5.1, delay: 50 },
    { ax: 0.3, ay: 0.2, az: 1.0, delay: 1000 },
    { ax: 0.2, ay: 0.1, az: 0.9, delay: 1000 },
    { ax: 0.15, ay: 0.15, az: 1.0, delay: 1000 },
  ];
};
