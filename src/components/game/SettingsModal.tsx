import React, { useState } from 'react';
import Modal from '../ui/Modal';
import './Modal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    currentValue: boolean
  ) => {
    setter(!currentValue);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Game Settings"
    >
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
    </Modal>
  );
}

export default SettingsModal;