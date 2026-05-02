import React, { useState, useRef } from 'react';
import { saveIncident, saveEvent } from '../lib/storage';
import { IncidentReporter } from '../lib/incidentReporter';
import { sendIncidentAlert } from '../lib/notifications';

function IncidentReporting({ onViewChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reporterInstance] = useState(() => new IncidentReporter());
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('medium');
  const [savedIncidentId, setSavedIncidentId] = useState(null);

  const startVoiceRecording = async () => {
    if (!reporterInstance.canUseVoice()) {
      setTranscript('Voice recognition not available. Please type your report.');
      return;
    }

    setIsRecording(true);
    setTranscript('Listening...');

    reporterInstance.startListening(
      (interim) => setTranscript(interim),
      (error) => {
        setTranscript(`Error: ${error}`);
        setIsRecording(false);
      },
      (final) => {
        setTranscript(final);
        setIsRecording(false);
        if (final.trim()) {
          setShowConfirm(true);
        }
      }
    );
  };

  const stopVoiceRecording = () => {
    reporterInstance.stopListening();
    setIsRecording(false);
  };

  const handleManualInput = (e) => {
    setTranscript(e.target.value);
  };

  const handleSubmitIncident = async () => {
    if (!transcript.trim()) {
      return;
    }

    const incident = reporterInstance.buildIncident(transcript);
    incident.severity = selectedSeverity;

    try {
      const incidentId = await saveIncident(incident);
      setSavedIncidentId(incidentId);

      await saveEvent({
        type: 'incident',
        timestamp: Date.now(),
        transcript: transcript,
        metadata: { source: incident.source, severity: selectedSeverity }
      });

      sendIncidentAlert(incident);
      
      setShowConfirm(false);
      setTranscript('');
      
      setTimeout(() => {
        onViewChange('home');
      }, 2000);
    } catch (error) {
      console.error('Error saving incident:', error);
      setTranscript('Error saving incident. Please try again.');
    }
  };

  if (savedIncidentId) {
    return (
      <div className="p-4 pt-6 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold mb-2">Incident Saved</h2>
          <p className="text-gray-600 mb-4">Your incident report has been recorded.</p>
          <p className="text-sm text-gray-500">Emergency contacts have been notified.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Report Incident</h1>

      {/* Voice Recorder */}
      <div className="card bg-blue-50 border-blue-200 mb-4">
        <div className="flex gap-3">
          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`flex-1 py-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <span className="text-2xl">{isRecording ? '⏹️' : '🎤'}</span>
            <span>{isRecording ? 'Stop' : 'Start'} Recording</span>
          </button>
        </div>
        {isRecording && (
          <div className="mt-3 text-center">
            <div className="inline-block animate-pulse">
              <div className="text-4xl">🎤</div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Listening...</p>
          </div>
        )}
      </div>

      {/* Transcript Input */}
      <div className="card mb-4">
        <label className="block font-semibold mb-2">Transcript / Report</label>
        <textarea
          value={transcript}
          onChange={handleManualInput}
          placeholder="Your incident report will appear here or type manually..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32 text-base"
        />
        <div className="text-xs text-gray-500 mt-2">
          {transcript.length} characters
        </div>
      </div>

      {/* Severity Selector */}
      <div className="card mb-4">
        <label className="block font-semibold mb-3">Severity Level</label>
        <div className="space-y-2">
          {['low', 'medium', 'high', 'critical'].map(level => (
            <button
              key={level}
              onClick={() => setSelectedSeverity(level)}
              className={`w-full p-3 rounded-lg font-semibold text-left transition ${
                selectedSeverity === level
                  ? level === 'critical' ? 'bg-red-600 text-white'
                    : level === 'high' ? 'bg-orange-600 text-white'
                    : level === 'medium' ? 'bg-yellow-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Extracted Info (if available) */}
      {transcript.trim() && (
        <div className="card bg-gray-50 border-gray-200 mb-4">
          <h3 className="font-semibold mb-3">Extracted Information</h3>
          <div className="text-sm space-y-2">
            <div><strong>Keywords:</strong> {reporterInstance.extractKeywords(transcript).join(', ') || 'None detected'}</div>
            <div><strong>Location:</strong> {reporterInstance.extractLocation(transcript) || 'Not specified'}</div>
            <div><strong>Time Mentioned:</strong> {reporterInstance.extractTime(transcript) || 'Now'}</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {transcript.trim() && (
          <>
            <button
              onClick={() => setShowConfirm(!showConfirm)}
              className="btn-primary"
            >
              {showConfirm ? '✓ Ready to Submit' : 'Review & Submit'}
            </button>
            {showConfirm && (
              <>
                <button
                  onClick={handleSubmitIncident}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                >
                  Confirm & Save Incident
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </>
            )}
          </>
        )}
        <button
          onClick={() => {
            setTranscript('');
            onViewChange('home');
          }}
          className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold"
        >
          Back to Home
        </button>
      </div>

      {/* Browser Support Notice */}
      {!reporterInstance.canUseVoice() && (
        <div className="card bg-yellow-50 border-yellow-300 mt-4">
          <p className="text-sm text-yellow-800">
            💡 Voice recognition is not available on this device/browser. Please type your report manually.
          </p>
        </div>
      )}
    </div>
  );
}

export default IncidentReporting;
