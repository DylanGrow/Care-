export class IncidentReporter {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListening = false;
    this.transcript = '';
    this.isFinal = false;
    this.confidence = 0;
  }

  canUseVoice() {
    return this.recognition !== null;
  }

  startListening(onTranscript, onError, onEnd) {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }

    this.transcript = '';
    this.confidence = 0;
    this.isListening = true;
    this.recognition.continuous = true; // Changed to true for better mobile flow
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.transcript += event.results[i][0].transcript;
          this.confidence = event.results[i][0].confidence;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onTranscript(this.transcript + interim, this.confidence);
    };

    this.recognition.onerror = (event) => onError(event.error);
    this.recognition.onend = () => {
      this.isListening = false;
      onEnd(this.transcript.trim(), this.confidence);
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  extractKeywords(text) {
    const urgentKeywords = ['help', 'pain', 'fall', 'injury', 'emergency', 'hurt', 'broken', 'stuck', 'bleeding', 'chest', 'breathe'];
    const textLower = text.toLowerCase();
    return urgentKeywords.filter(kw => textLower.includes(kw));
  }

  extractTime(text) {
    const timeMatch = text.match(/\b(\d{1,2}):?(\d{2})?\s?(am|pm|AM|PM)?\b/);
    return timeMatch ? timeMatch[0] : null;
  }

  extractLocation(text) {
    const locKeywords = ['bedroom', 'bathroom', 'kitchen', 'living room', 'outside', 'stairs'];
    const textLower = text.toLowerCase();
    return locKeywords.find(loc => textLower.includes(loc)) || null;
  }

  validateTranscript(text) {
    if (!text || text.length < 3) return { isValid: false, reason: 'Too short' };
    const words = text.trim().split(/\s+/).length;
    if (words < 2) return { isValid: false, reason: 'Too few words' };
    return { isValid: true, reason: 'Valid incident report' };
  }

  buildIncident(transcript, source = 'voice', voiceConfidence = 0.8) {
    const keywords = this.extractKeywords(transcript);
    let severity = keywords.length >= 2 ? 'high' : keywords.length >= 1 ? 'medium' : 'low';
    
    return {
      timestamp: Date.now(),
      source,
      transcript,
      extracted: {
        time: this.extractTime(transcript),
        location: this.extractLocation(transcript),
        symptoms: keywords.join(', ') || 'not specified'
      },
      severity,
      notified: false
    };
  }
}
