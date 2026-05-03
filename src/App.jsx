import React, { useState, useEffect } from 'react';
import './index.css';
import Home from './components/Home';
import Timeline from './components/Timeline';
import IncidentReporting from './components/IncidentReporting';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { getSetting, saveSetting } from './lib/storage'; // Removed initDB here to avoid startup crashes
import { requestNotificationPermission } from './lib/notifications';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [textSize, setTextSize] = useState('normal');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user has completed onboarding
      const hasOnboarded = await getSetting('hasOnboarded');
      if (hasOnboarded === undefined || hasOnboarded === false) {
        setShowOnboarding(true);
      }

      // Load text size settings
      const savedTextSize = await getSetting('textSize');
      if (savedTextSize) {
        setTextSize(savedTextSize);
        document.documentElement.classList.toggle('text-lg', savedTextSize === 'large');
      }

      // Permissions
      requestNotificationPermission();
      
      // Relative Service Worker Registration (Fixed for GitHub Pages)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', {
          scope: './'
        }).catch(err => console.log('SW registration failed:', err));
      }
    } catch (error) {
      console.error("App failed to initialize storage:", error);
      // Even if storage fails, we show the app so it's not a white screen
    }
  };

  const handleOnboardingComplete = async () => {
    await saveSetting('hasOnboarded', true);
    setShowOnboarding(false);
  };

  const handleTextSizeChange = async (size) => {
    setTextSize(size);
    await saveSetting('textSize', size);
    document.documentElement.classList.toggle('text-lg', size === 'large');
  };

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`w-full min-h-screen bg-gray-50 ${textSize === 'large' ? 'text-lg' : ''}`}>
      <div className="pb-24">
        {currentView === 'home' && (
          <Home 
            riskScore={riskScore}
            setRiskScore={setRiskScore}
            onViewChange={setCurrentView}
          />
        )}
        {currentView === 'timeline' && <Timeline onViewChange={setCurrentView} />}
        {currentView === 'incident' && <IncidentReporting onViewChange={setCurrentView} />}
        {currentView === 'settings' && (
          <Settings 
            onViewChange={setCurrentView}
            textSize={textSize}
            onTextSizeChange={handleTextSizeChange}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-20 z-40">
        <NavButton 
          icon="🏠" 
          label="Home" 
          active={currentView === 'home'} 
          onClick={() => setCurrentView('home')} 
        />
        <NavButton 
          icon="📋" 
          label="Timeline" 
          active={currentView === 'timeline'} 
          onClick={() => setCurrentView('timeline')} 
        />
        <NavButton 
          icon="⚙️" 
          label="Settings" 
          active={currentView === 'settings'} 
          onClick={() => setCurrentView('settings')} 
        />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-20 rounded-none bg-transparent border-none ${
        active ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-500'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
}

export default App;
