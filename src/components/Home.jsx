import React, { useState, useEffect } from 'react';
import { FallDetector, createDemoMotionSequence } from '../lib/fallDetector';
import { saveEvent, getSetting, saveSetting, getIncidents } from '../lib/storage';
import { sendFallAlert, sendIncidentAlert } from '../lib/notifications';
import { IncidentReporter } from '../lib/incidentReporter';

function Home({ riskScore, setRiskScore, onViewChange }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sensorData, setSensorData] = useState({ ax: 0, ay: 0, az: 0 });
  const [fallDetector, setFallDetector] = useState(null);
  const [lastMotionTime, setLastMotionTime] = useState(Date.now());
  const [demoMode, setDemoMode] = useState(false);
  const [sensitivity, setSensitivity] = useState(3.0);

  useEffect(() => {
    initMonitoring();
    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, []);

  const initMonitoring = async () => {
    const detector = new FallDetector({ accelThreshold: sensitivity });
    setFallDetector(detector);

    const demoEnabled = await getSetting('demoMode');
    setDemoMode(demoEnabled || false);

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      setIsMonitoring(true);
    }

    updateRiskScore();
  };

  const handleDeviceMotion = (event) => {
    const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity || {};
    const gx = event.rotationRate?.alpha || 0;
    const gy = event.rotationRate?.beta || 0;
    const gz = event.rotationRate?.gamma || 0;
    
    setSensorData({ ax: x, ay: y, az: z });

    if (fallDetector) {
      // Get device orientation if available
      const alpha = event.alpha;
      const beta = event.beta;
      const gamma = event.gamma;
      
      const result = fallDetector.processMotion(x, y, z, gx, gy, gz, alpha, beta, gamma);
      
      if (result?.type === 'fall_confirmed') {
        if (result.requiresConfirmation) {
          // Low confidence: ask user to confirm
          showFallConfirmation(result);
        } else {
          // High confidence: auto-alert
          handleFallDetected(result);
        }
      }

      if (x !== 0 || y !== 0) {
        setLastMotionTime(Date.now());
      }
    }
  };

  const showFallConfirmation = (fallData) => {
    const confirmed = window.confirm(
      `Possible fall detected (${(fallData.confidence * 100).toFixed(0)}% confidence)\n\nAre you OK?`
    );
    if (!confirmed) {
      handleFallDetected(fallData);
    }
  };

  const handleFallDetected = async (fallData) => {
    const event = {
      type: 'motion',
      timestamp: Date.now(),
      ax: sensorData.ax,
      ay: sensorData.ay,
      az: sensorData.az,
      confidence: fallData.confidence,
      metadata: { source: 'devicemotion' }
    };
    
    await saveEvent(event);
    sendFallAlert(fallData);
    setRiskScore(100);
    
    onViewChange('incident');
  };

  const updateRiskScore = async () => {
    const incidents = await getIncidents();
    const recentIncidents = incidents.filter(
      i => Date.now() - i.timestamp < 24 * 60 * 60 * 1000
    ).length;

    const inactiveHours = (Date.now() - lastMotionTime) / (60 * 60 * 1000);
    let score = Math.min(100, recentIncidents * 20 + inactiveHours * 2);
    
    setRiskScore(score);
  };

  const triggerDemoFall = async () => {
    const sequence = createDemoMotionSequence();
    let delay = 0;
    
    for (const motion of sequence) {
      delay += motion.delay;
      setTimeout(() => {
        setSensorData({ ax: motion.ax, ay: motion.ay, az: motion.az });
        if (fallDetector) {
          const result = fallDetector.processMotion(motion.ax, motion.ay, motion.az);
          if (result?.type === 'fall_candidate') {
            handleFallDetected(result);
          }
        }
      }, delay);
    }
  };

  const [panicHeld, setPanicHeld] = useState(false);
  const [panicProgress, setPanicProgress] = useState(0);
  const panicTimerRef = useRef(null);

  const handlePanicStart = () => {
    setPanicHeld(true);
    setPanicProgress(0);
    let progress = 0;
    
    panicTimerRef.current = setInterval(() => {
      progress += 50;
      setPanicProgress(progress);
      
      if (progress >= 2000) {
        clearInterval(panicTimerRef.current);
        triggerPanic();
      }
    }, 50);
  };

  const handlePanicEnd = () => {
    if (panicTimerRef.current) {
      clearInterval(panicTimerRef.current);
    }
    setPanicHeld(false);
    setPanicProgress(0);
  };

  const triggerPanic = async () => {
    handlePanicEnd();
    const now = Date.now();
    
    const panicIncident = {
      timestamp: now,
      source: 'panic',
      transcript: 'Panic button pressed',
      extracted: { symptoms: 'urgent assistance requested' },
      severity: 'critical',
      notified: false
    };

    const reporter = new IncidentReporter();
    const incidentId = await saveEvent({
      type: 'incident',
      timestamp: now,
      confidence: 1.0,
      metadata: { source: 'panic' }
    });

    sendIncidentAlert(panicIncident);
    setRiskScore(100);
    
    onViewChange('incident');
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-red-100 border-red-300';
    if (score >= 50) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getRiskText = (score) => {
    if (score >= 80) return 'HIGH RISK';
    if (score >= 50) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  return (
    <div className="p-4 pt-6">
      {/* Risk Card */}
      <div className={`card border-2 ${getRiskColor(riskScore)} mb-6`}>
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">CareCompass Lite</h1>
          <span className="text-3xl">❤️</span>
        </div>
        <div className="text-center py-4">
          <div className={`text-5xl font-bold ${riskScore >= 80 ? 'text-red-600' : riskScore >= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
            {getRiskText(riskScore)}
          </div>
          <div className="text-sm mt-2 text-gray-700">
            Risk Score: {Math.round(riskScore)}%
          </div>
        </div>
      </div>

      {/* Sensor Debug Info (Development) */}
      {demoMode && (
        <div className="card bg-gray-100 text-xs font-mono mb-4">
          <div>Accel: ({sensorData.ax?.toFixed(2)}, {sensorData.ay?.toFixed(2)}, {sensorData.az?.toFixed(2)})</div>
          <div>Monitoring: {isMonitoring ? '✓' : '✗'}</div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <ActionButton 
          icon="☎️" 
          label="Call Emergency" 
          onClick={() => window.location.href = 'tel:911'}
        />
        <ActionButton 
          icon="📱" 
          label="Share Status" 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'CareCompass Alert',
                text: `Risk Score: ${Math.round(riskScore)}%. Last activity: ${new Date(lastMotionTime).toLocaleTimeString()}`
              });
            }
          }}
        />
      </div>

      {/* Panic Button */}
      <button
        onMouseDown={handlePanicStart}
        onMouseUp={handlePanicEnd}
        onMouseLeave={handlePanicEnd}
        onTouchStart={handlePanicStart}
        onTouchEnd={handlePanicEnd}
        className="w-32 h-32 mx-auto rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-lg flex items-center justify-center mb-6 transition-transform relative"
      >
        <div className="flex flex-col items-center">
          <div className="text-4xl">🆘</div>
          <div className="text-xs text-white font-bold mt-2">PANIC</div>
        </div>
        
        {panicHeld && (
          <div className="absolute inset-0 rounded-full border-4 border-white opacity-50"
            style={{
              backgroundImage: `conic-gradient(white ${panicProgress * 0.18}deg, transparent ${panicProgress * 0.18}deg)`,
            }}
          />
        )}
        
        {panicProgress > 0 && (
          <div className="absolute top-1 text-white text-xs font-bold">
            {Math.round(panicProgress / 20)}%
          </div>
        )}
      </button>

      {panicHeld && (
        <div className="text-center mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
          <p className="text-sm font-semibold text-red-700">
            Hold for 2 seconds to activate panic alert
          </p>
          <p className="text-xs text-red-600 mt-1">
            {Math.round(panicProgress / 20)}% - Release to cancel
          </p>
        </div>
      )}

      {/* Demo Controls */}
      {demoMode && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3">Demo Mode</h3>
          <button
            onClick={triggerDemoFall}
            className="btn-primary mb-2"
          >
            Simulate Fall
          </button>
          <button
            onClick={() => {
              const now = Date.now();
              saveEvent({
                type: 'interaction',
                timestamp: now,
                metadata: { action: 'demo_button' }
              });
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
          >
            Log Activity
          </button>
        </div>
      )}

      {/* Sensitivity Control */}
      <div className="card">
        <label className="block mb-2 font-semibold">Sensitivity</label>
        <input
          type="range"
          min="1"
          max="5"
          step="0.5"
          value={sensitivity}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setSensitivity(val);
            if (fallDetector) {
              fallDetector.accelThreshold = val;
            }
          }}
          className="w-full"
        />
        <div className="text-sm text-gray-600 mt-1">
          Threshold: {sensitivity.toFixed(1)}g (lower = more sensitive)
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-200 rounded-lg active:bg-gray-50 min-h-20"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-semibold text-center">{label}</span>
    </button>
  );
}

export default Home;
