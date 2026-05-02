export class IncidentReporter {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isListening = false;
    this.transcript = '';
    this.isFinal = false;
    this.confidence = 0; // 0-1 confidence score
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
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let maxConfidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const conf = event.results[i][0].confidence || 0.8;
        
        maxConfidence = Math.max(maxConfidence, conf);
        
        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
          this.isFinal = true;
          this.confidence = conf;
        } else {
          interim += transcript;
        }
      }
      
      onTranscript(this.transcript + interim, Math.max(this.confidence, maxConfidence));
    };

    this.recognition.onerror = (event) => {
      onError(event.error);
    };

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
    const urgentKeywords = [
      'help', 'pain', 'fall', 'injury', 'emergency', 'hurt', 'broken',
      'cannot', 'can\'t', 'stuck', 'trapped', 'bleeding', 'unconscious',
      'dizzy', 'chest', 'breathe', 'call', 'alert', 'hurts', 'dying'
    ];
    const textLower = text.toLowerCase();
    return urgentKeywords.filter(kw => textLower.includes(kw));
  }

  extractTime(text) {
    const timeMatch = text.match(/\b(\d{1,2}):?(\d{2})?\s?(am|pm|AM|PM)?\b/);
    return timeMatch ? timeMatch[0] : null;
  }

  extractLocation(text) {
    const locKeywords = [
      'bedroom', 'bathroom', 'kitchen', 'living room', 'hallway',
      'outside', 'stairs', 'garage', 'basement', 'attic', 'porch',
      'den', 'office', 'closet', 'laundry'
    ];
    const textLower = text.toLowerCase();
    return locKeywords.find(loc => textLower.includes(loc)) || null;
  }

  // Validate transcript - check if it's coherent and relevant
  validateTranscript(text) {
    if (!text || text.length < 3) {
      return { isValid: false, reason: 'Too short', confidence: 0 };
    }
    
    const words = text.trim().split(/\s+/).length;
    
    // Very short = probably noise
    if (words < 2) {
      return { isValid: false, reason: 'Too few words', confidence: 0.2 };
    }
    
    // Very long = probably rambling or multiple sentences
    if (words > 100) {
      return { isValid: true, reason: 'Long report', confidence: 0.6 };
    }
    
    // Check if it has known keywords
    const keywords = this.extractKeywords(text);
    if (keywords.length === 0) {
      return { isValid: true, reason: 'No urgent keywords detected', confidence: 0.4 };
    }
    
    return { isValid: true, reason: 'Valid incident report', confidence: 0.8 };
  }

  buildIncident(transcript, source = 'voice', voiceConfidence = 0.8) {
    const keywords = this.extractKeywords(transcript);
    const validation = this.validateTranscript(transcript);
    
    // Determine severity based on keywords and voice confidence
    let severity = 'low';
    if (keywords.length >= 3 && voiceConfidence > 0.7) {
      severity = 'critical';
    } else if (keywords.length >= 2 && voiceConfidence > 0.6) {
      severity = 'high';
    } else if (keywords.length >= 1) {
      severity = 'medium';
    }
    
    return {
      timestamp: Date.now(),
      source,
      transcript,
      voiceConfidence,
      extracted: {
        time: this.extractTime(transcript),
        location: this.extractLocation(transcript),
        symptoms: keywords.join(', ') || 'not specified'
      },
      severity,
      validation,
      notified: false,
      ack_by: null
    };
  }
}
