import React, { useState } from 'react';
import { requestNotificationPermission } from '../lib/notifications';

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to CareCompass Lite',
      subtitle: 'Mobile-First Eldercare Monitoring',
      icon: '❤️',
      content: 'A quick setup to get you monitoring safely. This is a 24-hour MVP—no cloud, all local.'
    },
    {
      title: 'Fall Detection',
      subtitle: 'How it works',
      icon: '📱',
      content: 'This app monitors device motion to detect potential falls. Your phone accelerometer detects sudden changes.'
    },
    {
      title: 'Incident Reporting',
      subtitle: 'Voice or Text',
      icon: '🎤',
      content: 'Report incidents using your voice or by typing. Details are extracted automatically.'
    },
    {
      title: 'Notifications',
      subtitle: 'Stay Alerted',
      icon: '🔔',
      content: 'We will send notifications for fall alerts and incidents. Tap Allow when prompted.'
    },
    {
      title: 'Privacy First',
      subtitle: 'Your Data, Your Device',
      icon: '🔒',
      content: 'All data stays on your phone. Nothing is sent to a server. You control everything.'
    },
    {
      title: 'Ready to Go!',
      subtitle: 'You are all set',
      icon: '✨',
      content: 'You can now monitor, report, and stay safe. Visit Settings to add an emergency contact.'
    }
  ];

  const currentStep = steps[step];

  const handleNext = async () => {
    if (step === 3) {
      // Request notification permission on the notifications step
      await requestNotificationPermission();
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Progress Indicator */}
        <div className="flex gap-1 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i < step ? 'bg-blue-600' : i === step ? 'bg-blue-400' : 'bg-blue-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentStep.icon}</div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">{currentStep.title}</h1>
          <h2 className="text-lg text-gray-600 mb-4">{currentStep.subtitle}</h2>
          <p className="text-gray-700 text-base leading-relaxed">{currentStep.content}</p>
        </div>

        {/* Visual Aid for Step 2 (Fall Detection) */}
        {step === 1 && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="text-center space-y-3">
              <div className="text-4xl">📊</div>
              <p className="text-sm text-gray-600">
                Detects sudden acceleration + period of inactivity = potential fall
              </p>
            </div>
          </div>
        )}

        {/* Visual Aid for Step 3 (Incident Reporting) */}
        {step === 2 && (
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎤</span>
                <span>Press mic button to start recording</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                <span>Or type your report manually</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                <span>Confirm before saving</span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleNext}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-lg transition"
          >
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
          {step < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-sm"
            >
              Skip Tour
            </button>
          )}
        </div>

        {/* Step Counter */}
        <div className="text-center mt-4 text-sm text-gray-600">
          Step {step + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
