// Offline detection and automatic sync queuing

export class OfflineSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.listeners = [];
    
    window.addEventListener('online', () => this.setOnline(true));
    window.addEventListener('offline', () => this.setOnline(false));
  }

  setOnline(online) {
    const wasOnline = this.isOnline;
    this.isOnline = online;
    
    if (online && !wasOnline) {
      this.notifyListeners('online');
      this.processSyncQueue();
    } else if (!online && wasOnline) {
      this.notifyListeners('offline');
    }
  }

  // Queue an operation to sync when online
  queueForSync(operation) {
    this.syncQueue.push({
      operation,
      timestamp: Date.now(),
      retries: 0
    });
  }

  // Process queued operations
  async processSyncQueue() {
    while (this.syncQueue.length > 0 && this.isOnline) {
      const item = this.syncQueue.shift();
      try {
        await item.operation();
      } catch (error) {
        // Re-queue on failure
        item.retries++;
        if (item.retries < 3) {
          this.syncQueue.unshift(item);
        }
      }
    }
  }

  // Subscribe to online/offline events
  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(cb => cb(status));
  }

  // Get current status
  getStatus() {
    return {
      isOnline: this.isOnline,
      queuedOperations: this.syncQueue.length
    };
  }

  // Check if can reach server (if you ever add backend)
  async checkConnectivity() {
    try {
      const response = await fetch('/carecompass-lite/index.html', { 
        method: 'HEAD',
        mode: 'no-cors'
      });
      return response.ok || response.type === 'opaque';
    } catch {
      return false;
    }
  }
}

// Health check to verify app is working
export const performHealthCheck = async () => {
  const checks = {
    indexedDB: false,
    serviceWorker: false,
    localStorage: false,
    connectivity: false,
    timestamp: Date.now()
  };

  // Check IndexedDB
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('carecompass', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result);
        request.result.close();
      };
    });
    checks.indexedDB = true;
  } catch (e) {
    checks.indexedDB = false;
  }

  // Check Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      checks.serviceWorker = registrations.length > 0;
    } catch (e) {
      checks.serviceWorker = false;
    }
  }

  // Check localStorage
  try {
    localStorage.setItem('_health_check', 'ok');
    checks.localStorage = localStorage.getItem('_health_check') === 'ok';
    localStorage.removeItem('_health_check');
  } catch (e) {
    checks.localStorage = false;
  }

  // Check connectivity
  checks.connectivity = navigator.onLine;

  return checks;
};

// Data backup warnings
export const checkBackupNeeded = async (lastBackupTime) => {
  const now = Date.now();
  const daysSinceBackup = (now - lastBackupTime) / (1000 * 60 * 60 * 24);

  if (daysSinceBackup > 7) {
    return {
      needed: true,
      urgency: 'high',
      message: `Last backup was ${Math.floor(daysSinceBackup)} days ago. Please create a new backup.`
    };
  }

  if (daysSinceBackup > 3) {
    return {
      needed: true,
      urgency: 'medium',
      message: `Consider backing up your data (last backup ${Math.floor(daysSinceBackup)} days ago)`
    };
  }

  return { needed: false };
};
