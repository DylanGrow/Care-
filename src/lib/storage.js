const DB_NAME = 'carecompass';
const DB_VERSION = 1;

// Native IndexedDB Helper
const getDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventStore.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('incidents')) {
        const incStore = db.createObjectStore('incidents', { keyPath: 'id' });
        incStore.createIndex('timestamp', 'timestamp', { unique: false });
        incStore.createIndex('severity', 'severity', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('audio')) {
        db.createObjectStore('audio', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Database Wrapper
const dbAction = async (storeName, mode, callback) => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveEvent = async (event) => {
  event.id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  event.timestamp = event.timestamp || Date.now();
  await dbAction('events', 'readwrite', (store) => store.add(event));
  return event.id;
};

export const getEvents = async (limit = 100) => {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('events', 'readonly');
    const store = transaction.objectStore('events');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // Newest first
    const results = [];
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
};

export const saveIncident = async (incident) => {
  incident.id = `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  incident.timestamp = incident.timestamp || Date.now();
  await dbAction('incidents', 'readwrite', (store) => store.add(incident));
  return incident.id;
};

export const getIncidents = async () => {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction('incidents', 'readonly');
    const store = transaction.objectStore('incidents');
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev');
    const results = [];
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
  });
};

export const getSetting = async (key) => {
  const result = await dbAction('settings', 'readonly', (store) => store.get(key));
  return result?.value;
};

export const saveSetting = async (key, value) => {
  await dbAction('settings', 'readwrite', (store) => store.put({ key, value }));
};

export const getSettings = async () => {
  const all = await dbAction('settings', 'readonly', (store) => store.getAll());
  const result = {};
  all.forEach(s => result[s.key] = s.value);
  return result;
};

export const clearAllData = async () => {
  const db = await getDB();
  const tx = db.transaction(['events', 'incidents', 'audio'], 'readwrite');
  tx.objectStore('events').clear();
  tx.objectStore('incidents').clear();
  tx.objectStore('audio').clear();
};

export const exportData = async () => {
  const events = await dbAction('events', 'readonly', (store) => store.getAll());
  const incidents = await dbAction('incidents', 'readonly', (store) => store.getAll());
  const settings = await dbAction('settings', 'readonly', (store) => store.getAll());
  return {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    events,
    incidents,
    settings: settings.reduce((acc, s) => ({...acc, [s.key]: s.value}), {})
  };
};
