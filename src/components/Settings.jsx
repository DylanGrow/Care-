import React, { useState, useEffect } from 'react';
import { 
  getSettings, 
  saveSetting, 
  exportData, 
  importData, 
  clearAllData 
} from '../lib/storage';

function Settings({ onViewChange, textSize, onTextSizeChange }) {
  const [emergencyContact, setEmergencyContact] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getSettings();
    setEmergencyContact(settings.emergencyContact || '');
    setDemoMode(settings.demoMode || false);
  };

  const handleSaveContact = async () => {
    await saveSetting('emergencyContact', emergencyContact);
    alert('Emergency contact saved');
  };

  const handleDemoModeToggle = async () => {
    const newState = !demoMode;
    setDemoMode(newState);
    await saveSetting('demoMode', newState);
  };

  const handleExport = async () => {
    const data = await exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carecompass-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      setImportError('');
      alert('Data imported successfully!');
      setShowImport(false);
    } catch (err) {
      setImportError('Invalid backup file or import failed');
      console.error(err);
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure? This will delete all recorded events and incidents.')) {
      await clearAllData();
      alert('All data cleared');
    }
  };

  return (
    <div className="p-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Display Settings */}
      <div className="card mb-4">
        <h2 className="font-semibold text-lg mb-3">Display</h2>
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium">Text Size</span>
          </label>
          <div className="flex gap-2">
            {['normal', 'large'].map(size => (
              <button
                key={size}
                onClick={() => onTextSizeChange(size)}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold ${
                  textSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card mb-4">
        <h2 className="font-semibold text-lg mb-3">Emergency Contact</h2>
        <input
          type="tel"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSaveContact}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
        >
          Save Contact
        </button>
      </div>

      {/* Demo Mode */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Demo Mode</h2>
            <p className="text-xs text-gray-600 mt-1">Simulate falls and incidents without sensors</p>
          </div>
          <button
            onClick={handleDemoModeToggle}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              demoMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            {demoMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="card mb-4">
        <h2 className="font-semibold text-lg mb-3">Data Management</h2>
        <div className="space-y-2">
          <button
            onClick={() => setShowExport(!showExport)}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
          >
            📥 Export Data
          </button>
          
          {showExport && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm mb-2 text-green-900">
                Download all your data as a JSON backup file.
              </p>
              <button
                onClick={handleExport}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm"
              >
                Download Backup
              </button>
            </div>
          )}

          <button
            onClick={() => setShowImport(!showImport)}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            📤 Import Data
          </button>

          {showImport && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm mb-2 text-blue-900">
                Select a backup file to restore.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="w-full text-sm"
              />
              {importError && (
                <p className="text-sm text-red-600 mt-2">{importError}</p>
              )}
            </div>
          )}

          <button
            onClick={handleClearData}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
          >
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      {/* Permissions & Privacy */}
      <div className="card mb-4">
        <h2 className="font-semibold text-lg mb-3">Permissions & Privacy</h2>
        <div className="text-sm text-gray-700 space-y-2">
          <p>✓ <strong>Motion Sensor:</strong> Monitors device movement to detect falls</p>
          <p>✓ <strong>Notifications:</strong> Alerts you to events and incidents</p>
          <p>✓ <strong>Microphone:</strong> Records voice incident reports (with consent)</p>
          <p>✓ <strong>Web Share:</strong> Shares status with emergency contacts</p>
          <p className="mt-4 text-xs text-gray-600 italic">
            All data is stored locally on your device. Nothing is sent to a server.
          </p>
        </div>
      </div>

      {/* Device Compatibility */}
      <div className="card bg-blue-50 border-blue-200 mb-4">
        <h2 className="font-semibold text-lg mb-3">Device Compatibility</h2>
        <div className="text-sm space-y-1">
          <div>
            <strong>Motion Sensor:</strong> {
              window.DeviceMotionEvent ? '✓ Supported' : '✗ Not available'
            }
          </div>
          <div>
            <strong>Voice Recognition:</strong> {
              window.SpeechRecognition || window.webkitSpeechRecognition ? '✓ Supported' : '✗ Not available'
            }
          </div>
          <div>
            <strong>Notifications:</strong> {
              'Notification' in window ? '✓ Supported' : '✗ Not available'
            }
          </div>
          <div>
            <strong>Web Share:</strong> {
              navigator.share ? '✓ Supported' : '✗ Not available'
            }
          </div>
          <div>
            <strong>Service Worker:</strong> {
              'serviceWorker' in navigator ? '✓ Supported' : '✗ Not available'
            }
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card bg-gray-100 border-gray-300">
        <h2 className="font-semibold text-lg mb-2">About</h2>
        <p className="text-sm text-gray-700 mb-1"><strong>CareCompass Lite</strong></p>
        <p className="text-xs text-gray-600">Version 1.0.0</p>
        <p className="text-xs text-gray-600 mt-2">Mobile-first PWA for eldercare monitoring</p>
      </div>

      <button
        onClick={() => onViewChange('home')}
        className="w-full mt-6 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
      >
        Back to Home
      </button>
    </div>
  );
}

export default Settings;
