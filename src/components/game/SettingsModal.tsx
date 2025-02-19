// src/components/game/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import './Modal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Initialize state from localStorage if available
  const [hardMode, setHardMode] = useState(() => {
    const saved = localStorage.getItem('pokedle-hard-mode');
    return saved ? saved === 'true' : false;
  });
  
  const [colorBlindMode, setColorBlindMode] = useState(() => {
    const saved = localStorage.getItem('pokedle-colorblind-mode');
    return saved ? saved === 'true' : false;
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pokedle-dark-mode');
    return saved ? saved === 'true' : false;
  });

  // Apply settings when they change
  useEffect(() => {
    localStorage.setItem('pokedle-hard-mode', hardMode.toString());
    // Additional logic for hard mode implementation if needed
  }, [hardMode]);

  useEffect(() => {
    localStorage.setItem('pokedle-colorblind-mode', colorBlindMode.toString());
    if (colorBlindMode) {
      document.documentElement.classList.add('colorblind');
    } else {
      document.documentElement.classList.remove('colorblind');
    }
  }, [colorBlindMode]);

  useEffect(() => {
    localStorage.setItem('pokedle-dark-mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    currentValue: boolean
  ) => {
    setter(!currentValue);
  };

  const handleReset = () => {
    // Save current theme preference before reset
    const currentDarkMode = darkMode;
    const currentColorBlind = colorBlindMode;
    
    // Clear all localStorage items
    localStorage.clear();
    
    // Restore theme preferences to avoid jarring visual change
    localStorage.setItem('pokedle-dark-mode', currentDarkMode.toString());
    localStorage.setItem('pokedle-colorblind-mode', currentColorBlind.toString());
    
    // Reset game-specific settings
    setHardMode(false);
    
    // Show confirmation to user
    alert('Game progress has been reset!');
    // Optional: reload the page
    window.location.reload();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Game Settings"
    >
      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-label">Hard Mode</div>
          <div className="setting-description">Guesses must match previous correct hints</div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={hardMode}
            onChange={() => handleToggle(setHardMode, hardMode)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-label">Color Blind Mode</div>
          <div className="setting-description">High contrast colors with patterns for better accessibility</div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={colorBlindMode}
            onChange={() => handleToggle(setColorBlindMode, colorBlindMode)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="setting-item">
        <div className="setting-info">
          <div className="setting-label">Dark Mode</div>
          <div className="setting-description">Reduce eye strain with darker colors</div>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={darkMode}
            onChange={() => handleToggle(setDarkMode, darkMode)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <div className="reset-section">
        <h3 className="section-title">Reset Game Data</h3>
        <p className="reset-description">
          This will clear all your saved data including statistics and current streak.
          This action cannot be undone.
        </p>
        <button 
          className="reset-button"
          onClick={handleReset}
        >
          Reset All Progress
        </button>
      </div>
    </Modal>
  );
}

export default SettingsModal;