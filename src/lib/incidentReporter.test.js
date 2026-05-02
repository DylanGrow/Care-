import { IncidentReporter } from '../src/lib/incidentReporter';

describe('IncidentReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new IncidentReporter();
  });

  test('extracts urgent keywords from text', () => {
    const text = 'I fell and I need help';
    const keywords = reporter.extractKeywords(text);
    expect(keywords).toContain('fell');
    expect(keywords).toContain('help');
  });

  test('extracts location from text', () => {
    const text = 'I fell in the bathroom';
    const location = reporter.extractLocation(text);
    expect(location).toBe('bathroom');
  });

  test('extracts time from text', () => {
    const text = 'I fell at 2:30 pm';
    const time = reporter.extractTime(text);
    expect(time).toBeDefined();
    expect(time).toMatch(/\d{1,2}:\d{2}/);
  });

  test('builds incident with extracted data', () => {
    const transcript = 'I fell in the kitchen and my leg hurts';
    const incident = reporter.buildIncident(transcript, 'voice');
    
    expect(incident).toEqual(expect.objectContaining({
      transcript,
      source: 'voice',
      extracted: expect.objectContaining({
        location: 'kitchen'
      })
    }));
  });

  test('sets severity based on keywords', () => {
    const urgentTranscript = 'Emergency! I fell and cannot move';
    const urgentIncident = reporter.buildIncident(urgentTranscript);
    expect(urgentIncident.severity).toBe('high');

    const normalTranscript = 'I bumped my arm';
    const normalIncident = reporter.buildIncident(normalTranscript);
    expect(normalIncident.severity).toBe('medium');
  });

  test('handles manual incident creation', () => {
    const incident = reporter.buildIncident('Manual report text', 'manual');
    expect(incident.source).toBe('manual');
    expect(incident.timestamp).toBeDefined();
  });

  test('returns null for empty transcript', () => {
    const incident = reporter.buildIncident('');
    expect(incident.transcript).toBe('');
  });
});
