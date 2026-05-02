import { openDB } from 'idb';

const DB_NAME = 'carecompass';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('timestamp', 'timestamp');
        eventStore.createIndex('type', 'type');
      }
      if (!db.objectStoreNames.contains('incidents')) {
        const incStore = db.createObjectStore('incidents', { keyPath: 'id' });
        incStore.createIndex('timestamp', 'timestamp');
        incStore.createIndex('severity', 'severity');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio', { keyPath: 'id' });
      }
    }
  });
};

export const saveEvent = async (event) => {
  const db = await initDB();
  event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await db.add('events', event);
  return event.id;
};

export const getEvents = async (limit = 100) => {
  const db = await initDB();
  const allEvents = await db.getAllFromIndex('events', 'timestamp');
  return allEvents.reverse().slice(0, limit);
};

export const getEventsByType = async (type) => {
  const db = await initDB();
  return db.getAllFromIndex('events', 'type', type);
};

export const saveIncident = async (incident) => {
  const db = await initDB();
  incident.id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  incident.timestamp = incident.timestamp || Date.now();
  await db.add('incidents', incident);
  return incident.id;
};

export const getIncidents = async () => {
  const db = await initDB();
  const all = await db.getAllFromIndex('incidents', 'timestamp');
  return all.reverse();
};

export const updateIncident = async (id, updates) => {
  const db = await initDB();
  const incident = await db.get('incidents', id);
  if (incident) {
    Object.assign(incident, updates);
    await db.put('incidents', incident);
  }
  return incident;
};

export const getSetting = async (key) => {
  const db = await initDB();
  const setting = await db.get('settings', key);
  return setting?.value;
};

export const saveSetting = async (key, value) => {
  const db = await initDB();
  await db.put('settings', { key, value });
};

export const getSettings = async () => {
  const db = await initDB();
  const all = await db.getAll('settings');
  const result = {};
  all.forEach(s => result[s.key] = s.value);
  return result;
};

export const saveAudio = async (id, blob) => {
  const db = await initDB();
  await db.put('audio', { id, blob, timestamp: Date.now() });
};

export const getAudio = async (id) => {
  const db = await initDB();
  return db.get('audio', id);
};

export const exportData = async () => {
  const db = await initDB();
  const events = await db.getAll('events');
  const incidents = await db.getAll('incidents');
  const settings = await db.getAll('settings');
  return {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    events,
    incidents,
    settings: settings.reduce((acc, s) => ({...acc, [s.key]: s.value}), {})
  };
};

export const importData = async (data) => {
  const db = await initDB();
  if (data.events) {
    for (const evt of data.events) {
      await db.put('events', evt);
    }
  }
  if (data.incidents) {
    for (const inc of data.incidents) {
      await db.put('incidents', inc);
    }
  }
  if (data.settings) {
    for (const [key, value] of Object.entries(data.settings)) {
      await saveSetting(key, value);
    }
  }
};

export const clearAllData = async () => {
  const db = await initDB();
  await db.clear('events');
  await db.clear('incidents');
  await db.clear('audio');
};
