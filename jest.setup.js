// Mock IndexedDB for tests
const indexedDB = {
  open: jest.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
  writable: true,
});

// Mock DeviceMotionEvent
Object.defineProperty(window, 'DeviceMotionEvent', {
  value: class DeviceMotionEvent extends Event {
    constructor(type, eventInitDict) {
      super(type);
      this.accelerationIncludingGravity = eventInitDict?.accelerationIncludingGravity || {
        x: 0, y: 0, z: 9.8
      };
    }
  },
  writable: true,
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class Notification {
    constructor(title, options) {
      this.title = title;
      this.options = options;
    }
    static permission = 'default';
    static requestPermission = jest.fn(() => Promise.resolve('granted'));
  },
  writable: true,
});

// Mock SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  value: class SpeechRecognition extends EventTarget {
    start = jest.fn();
    stop = jest.fn();
    abort = jest.fn();
  },
  writable: true,
});
