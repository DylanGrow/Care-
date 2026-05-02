import React, { useState, useEffect } from 'react';
import { getEvents, getIncidents } from '../lib/storage';

function Timeline({ onViewChange }) {
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eventsData, incidentsData] = await Promise.all([
      getEvents(50),
      getIncidents()
    ]);
    setEvents(eventsData);
    setIncidents(incidentsData);
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventIcon = (type) => {
    const icons = {
      'motion': '🔔',
      'interaction': '👆',
      'notification': '📢',
      'incident': '⚠️'
    };
    return icons[type] || '📝';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'critical': 'bg-red-100 border-red-300',
      'high': 'bg-orange-100 border-orange-300',
      'medium': 'bg-yellow-100 border-yellow-300',
      'low': 'bg-blue-100 border-blue-300'
    };
    return colors[severity] || 'bg-gray-100 border-gray-300';
  };

  if (loading) {
    return (
      <div className="p-4 pt-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-gray-600">Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6">
      <h1 className="text-2xl font-bold mb-6">Activity Timeline</h1>

      {incidents.length === 0 && events.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-600">No events recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Incidents First */}
          {incidents.map(incident => (
            <div
              key={incident.id}
              className={`card border-2 ${getSeverityColor(incident.severity)} cursor-pointer transition`}
              onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-semibold flex justify-between items-center">
                    <span>Incident - {incident.severity.toUpperCase()}</span>
                    <span className="text-xs font-normal text-gray-600">
                      {formatTime(incident.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {incident.transcript || 'Manual incident'}
                  </div>
                </div>
              </div>
              
              {expandedId === incident.id && (
                <div className="mt-4 pt-4 border-t border-current border-opacity-20 text-sm">
                  <div className="mb-2"><strong>Source:</strong> {incident.source}</div>
                  {incident.extracted?.symptoms && (
                    <div className="mb-2"><strong>Symptoms:</strong> {incident.extracted.symptoms}</div>
                  )}
                  {incident.extracted?.location && (
                    <div className="mb-2"><strong>Location:</strong> {incident.extracted.location}</div>
                  )}
                  <div className="mb-2"><strong>Status:</strong> {incident.notified ? '✓ Notified' : '✗ Not notified'}</div>
                  {incident.transcript && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs max-h-20 overflow-y-auto">
                      "{incident.transcript}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Regular Events */}
          {events.map(event => (
            <div
              key={event.id}
              className="card border-l-4 border-blue-400 bg-blue-50 cursor-pointer hover:bg-blue-100"
              onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getEventIcon(event.type)}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm flex justify-between">
                    <span>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                    <span className="text-xs font-normal text-gray-600">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  {event.confidence && (
                    <div className="text-xs text-gray-600">
                      Confidence: {(event.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
              
              {expandedId === event.id && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-700">
                  <pre className="bg-white p-2 rounded text-xs overflow-x-auto max-h-24">
                    {JSON.stringify({
                      ax: event.ax?.toFixed(2),
                      ay: event.ay?.toFixed(2),
                      az: event.az?.toFixed(2),
                      confidence: event.confidence?.toFixed(2),
                      metadata: event.metadata
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(events.length > 0 || incidents.length > 0) && (
        <button
          onClick={loadData}
          className="w-full mt-6 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

export default Timeline;
