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
    try {
      const [eventsData, incidentsData] = await Promise.all([
        getEvents(50),
        getIncidents()
      ]);
      
      // Sort to ensure newest items are always at the top
      const sortedEvents = [...eventsData].sort((a, b) => b.timestamp - a.timestamp);
      const sortedIncidents = [...incidentsData].sort((a, b) => b.timestamp - a.timestamp);
      
      setEvents(sortedEvents);
      setIncidents(sortedIncidents);
    } catch (error) {
      console.error("Failed to load timeline data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
          <div className="text-4xl animate-bounce mb-2">📋</div>
          <div className="text-gray-600 font-medium">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Activity Timeline</h1>
        <button 
          onClick={() => onViewChange('home')}
          className="text-blue-600 font-semibold text-sm"
        >
          Close
        </button>
      </div>

      {incidents.length === 0 && events.length === 0 ? (
        <div className="text-center py-12 card bg-gray-50 border-dashed border-2 border-gray-200">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-600 mb-4">No events recorded yet.</p>
          <button 
            onClick={() => onViewChange('home')}
            className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-bold"
          >
            Go Home
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Incidents Section */}
          {incidents.map(incident => (
            <div
              key={incident.id || incident.timestamp}
              className={`card border-2 ${getSeverityColor(incident.severity)} cursor-pointer transition-all active:scale-95`}
              onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <div className="font-bold flex justify-between items-center">
                    <span>{incident.severity?.toUpperCase()} ALERT</span>
                    <span className="text-xs font-normal text-gray-500">
                      {formatTime(incident.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {incident.transcript || 'Manual incident report recorded.'}
                  </div>
                </div>
              </div>
              
              {expandedId === incident.id && (
                <div className="mt-4 pt-4 border-t border-black border-opacity-10 text-sm animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-white bg-opacity-50 rounded">
                      <div className="text-xxs uppercase text-gray-500 font-bold">Source</div>
                      <div className="font-medium capitalize">{incident.source}</div>
                    </div>
                    <div className="p-2 bg-white bg-opacity-50 rounded">
                      <div className="text-xxs uppercase text-gray-500 font-bold">Status</div>
                      <div className="font-medium">{incident.notified ? '✓ Notified' : '✗ Alert Pending'}</div>
                    </div>
                  </div>
                  {incident.extracted?.symptoms && (
                    <div className="mb-2"><strong>Findings:</strong> {incident.extracted.symptoms}</div>
                  )}
                  {incident.transcript && (
                    <div className="mt-2 p-3 bg-white bg-opacity-60 rounded italic text-gray-800">
                      "{incident.transcript}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Regular Events Section */}
          {events.map(event => (
            <div
              key={event.id || event.timestamp}
              className="card border-l-4 border-blue-400 bg-white shadow-sm cursor-pointer active:bg-gray-50"
              onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getEventIcon(event.type)}</span>
                <div className="flex-1">
                  <div className="font-semibold text-sm flex justify-between">
                    <span>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</span>
                    <span className="text-xs font-normal text-gray-500">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
              
              {expandedId === event.id && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-700 font-mono">
                  <div className="bg-gray-50 p-3 rounded overflow-x-auto">
                    <div>X: {event.ax?.toFixed(3) || '0.00'}</div>
                    <div>Y: {event.ay?.toFixed(3) || '0.00'}</div>
                    <div>Z: {event.az?.toFixed(3) || '0.00'}</div>
                    <div className="mt-1 text-blue-600">Conf: {((event.confidence || 0) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(events.length > 0 || incidents.length > 0) && (
        <button
          onClick={loadData}
          className="w-full mt-8 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-bold shadow-sm active:bg-gray-100"
        >
          Refresh Timeline
        </button>
      )}
    </div>
  );
}

export default Timeline;
