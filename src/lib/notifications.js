export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const defaults = {
      badge: '/carecompass-lite/icon-192.png',
      icon: '/carecompass-lite/icon-192.png',
      tag: 'carecompass',
      requireInteraction: true,
      ...options
    };
    return new Notification(title, defaults);
  }
};

export const sendIncidentAlert = (incident) => {
  const title = `Incident Alert - ${incident.severity.toUpperCase()}`;
  const options = {
    body: incident.transcript?.substring(0, 100) || 'Manual incident reported',
    tag: `incident_${incident.id}`,
    requireInteraction: true,
    actions: [
      { action: 'ack', title: 'I\'m OK', icon: '✓' },
      { action: 'call', title: 'Call Emergency', icon: '☎' }
    ]
  };
  return showNotification(title, options);
};

export const sendFallAlert = (fallData) => {
  const title = 'Fall Detected!';
  const options = {
    body: `Confidence: ${(fallData.confidence * 100).toFixed(0)}%`,
    tag: 'fall_detection',
    requireInteraction: true,
    badge: '/carecompass-lite/icon-192.png',
    actions: [
      { action: 'ok', title: 'I\'m OK', icon: '✓' },
      { action: 'help', title: 'Need Help', icon: '🆘' }
    ]
  };
  return showNotification(title, options);
};

export const sendTestNotification = () => {
  showNotification('CareCompass Alert', {
    body: 'This is a test notification',
    tag: 'test'
  });
};
