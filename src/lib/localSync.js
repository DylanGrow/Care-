// Local multi-device sync via QR codes
// Device A generates a QR code, Device B scans it
// They exchange data via a shared IndexedDB namespace (if on same network)

import { exportData, importData, initDB } from './storage.js';

export class LocalDeviceSync {
  constructor(deviceId = null) {
    this.deviceId = deviceId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.peers = {}; // Map of connected devices
    this.syncChannel = `sync_${this.deviceId}`;
  }

  // Generate shareable sync code (can be QR or manual)
  async generateSyncCode() {
    const data = await exportData();
    const code = {
      deviceId: this.deviceId,
      timestamp: Date.now(),
      dataHash: this.hashData(data),
      // Don't include full data in code - too large for QR
      // Instead, use this as a handshake
    };
    
    return code;
  }

  // Get code as QR-compatible string
  async generateSyncQRString() {
    const code = await this.generateSyncCode();
    // Format: cc_lite://sync/{deviceId}/{timestamp}/{hash}
    return `cc_lite://sync/${code.deviceId}/${code.timestamp}/${code.dataHash}`;
  }

  // Parse received QR code
  parseSyncCode(qrString) {
    const match = qrString.match(/cc_lite:\/\/sync\/([^\/]+)\/(\d+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      deviceId: match[1],
      timestamp: parseInt(match[2]),
      dataHash: match[3]
    };
  }

  // Hash data for verification
  hashData(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Register a peer device
  async registerPeer(peerId) {
    if (!this.peers[peerId]) {
      this.peers[peerId] = {
        id: peerId,
        lastSync: null,
        lastUpdate: null,
        role: 'peer' // or 'monitor' or 'monitored'
      };
    }
  }

  // Caregiver mode: this device monitors another
  async setupMonitoring(monitoredDeviceId, relationship = 'caregiver') {
    await this.registerPeer(monitoredDeviceId);
    this.peers[monitoredDeviceId].role = 'monitored';
    
    // Store monitoring relationship
    await initDB().then(db => {
      db.put('settings', {
        key: `monitoring_${monitoredDeviceId}`,
        value: {
          deviceId: monitoredDeviceId,
          relationship,
          startTime: Date.now()
        }
      });
    });
  }

  // Try to sync with local network (via shared IndexedDB if available)
  async syncViaLocalNetwork() {
    try {
      // This is limited without WebRTC/Bluetooth, but documents the pattern
      // In production, you'd use:
      // - WebRTC Data Channels
      // - Bluetooth Web API
      // - NFC (for nearby devices)
      // - QR code as handshake, then cloud storage for data
      
      return {
        success: false,
        reason: 'Local network sync requires additional setup (WebRTC, Bluetooth, etc.)',
        suggestion: 'Use QR code exchange for manual sync'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Manual sync: export data, share via email/messaging
  async getExportableData() {
    const data = await exportData();
    
    // Add sync metadata
    return {
      ...data,
      syncMetadata: {
        exportDeviceId: this.deviceId,
        exportTime: Date.now(),
        importInstructions: 'Settings → Import Data → Select this file'
      }
    };
  }

  // Check if we're being monitored by this device
  async getMonitoringStatus() {
    const db = await initDB();
    const monitorings = (await db.getAll('settings'))
      .filter(s => s.key.startsWith('monitoring_'));
    
    return monitorings.map(m => m.value);
  }

  // Get monitored devices (if this device is a caregiver)
  async getMonitoredDevices() {
    return Object.values(this.peers).filter(p => p.role === 'monitored');
  }

  // Simulate sync with another device (for demo purposes)
  async simulateSyncWithDevice(otherDeviceData) {
    try {
      await importData(otherDeviceData);
      
      // Update peer info
      const peerId = `device_${Date.now()}`;
      this.peers[peerId] = {
        id: peerId,
        lastSync: Date.now(),
        lastUpdate: otherDeviceData.exportDate,
        role: 'peer'
      };
      
      return {
        success: true,
        message: 'Data synced successfully',
        peerId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      deviceId: this.deviceId,
      connectedPeers: Object.keys(this.peers).length,
      peers: this.peers,
      lastSyncTime: Object.values(this.peers)
        .map(p => p.lastSync)
        .filter(Boolean)
        .sort()
        .pop() || null
    };
  }
}

// Helper to generate QR code data (you'd use a QR library to render it)
export const generateQRCodeData = (qrString) => {
  // Return data suitable for a QR code library like qrcode.js
  return {
    data: qrString,
    size: 200,
    level: 'M',
    colorDark: '#000000',
    colorLight: '#ffffff'
  };
};
