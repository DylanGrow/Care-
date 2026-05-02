import { FallDetector, createDemoMotionSequence } from '../src/lib/fallDetector';

describe('FallDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new FallDetector({ accelThreshold: 3.0 });
  });

  test('computes resultant acceleration correctly', () => {
    const resultant = detector.computeResultant(3, 4, 0);
    expect(resultant).toBeCloseTo(5, 1);
  });

  test('detects spike when acceleration exceeds threshold', () => {
    const result = detector.processMotion(4.5, 3.2, 5.1);
    expect(result).toEqual(expect.objectContaining({ type: 'spike' }));
    expect(result.resultant).toBeGreaterThan(3.0);
  });

  test('does not detect spike for normal motion', () => {
    const result = detector.processMotion(0.1, 0.2, 1.0);
    expect(result).toBeNull();
  });

  test('detects fall after spike + inactivity', (done) => {
    detector.processMotion(4.5, 3.2, 5.1);
    
    setTimeout(() => {
      const result = detector.processMotion(0.05, 0.05, 0.95);
      expect(result?.type).toBe('fall_candidate');
      expect(result?.confidence).toBeGreaterThan(0);
      done();
    }, 6000);
  });

  test('checks inactivity correctly', () => {
    const lastActivity = Date.now() - (13 * 60 * 60 * 1000);
    const isInactive = detector.checkInactivity(lastActivity, 12 * 60 * 60 * 1000);
    expect(isInactive).toBe(true);
  });

  test('checks night activity correctly', () => {
    const nightHour = 23;
    const isNight = detector.checkNightActivity(nightHour);
    expect(isNight).toBe(true);

    const dayHour = 14;
    const isDay = detector.checkNightActivity(dayHour);
    expect(isDay).toBe(false);
  });

  test('debounce prevents rapid repeated detections', (done) => {
    detector.processMotion(4.5, 3.2, 5.1);
    
    setTimeout(() => {
      detector.processMotion(0.05, 0.05, 0.95);
      
      // Try to detect another fall immediately
      const result2 = detector.processMotion(5.0, 4.0, 6.0);
      expect(result2).toBeNull();
      
      done();
    }, 6000);
  });
});

describe('createDemoMotionSequence', () => {
  test('returns an array of motion data', () => {
    const sequence = createDemoMotionSequence();
    expect(Array.isArray(sequence)).toBe(true);
    expect(sequence.length).toBeGreaterThan(0);
  });

  test('includes spike and recovery motion', () => {
    const sequence = createDemoMotionSequence();
    const spike = sequence.find(m => detector.computeResultant(m.ax, m.ay, m.az) > 3);
    expect(spike).toBeDefined();
  });
});
