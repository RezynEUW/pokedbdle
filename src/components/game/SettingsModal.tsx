// src/components/game/SettingsModal.tsx
import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [hardMode, setHardMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  if (!isOpen) return null;

  const toggleSetting = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(prev => !prev);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Game Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <SettingToggle 
            label="Hard Mode" 
            description="Guesses must match previous correct guesses"
            isEnabled={hardMode}
            onToggle={() => toggleSetting(setHardMode)}
          />

          <SettingToggle 
            label="Color Blind Mode" 
            description="Alternative color scheme for better accessibility"
            isEnabled={colorBlindMode}
            onToggle={() => toggleSetting(setColorBlindMode)}
          />

          <SettingToggle 
            label="Dark Mode" 
            description="Switch to dark color scheme"
            isEnabled={darkMode}
            onToggle={() => toggleSetting(setDarkMode)}
          />

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold mb-2">Reset Game Data</h3>
            <button 
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition-colors"
              onClick={() => {
                // Implement reset logic
                localStorage.clear();
                window.location.reload();
              }}
            >
              Reset All Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  isEnabled: boolean;
  onToggle: () => void;
}

function SettingToggle({ 
  label, 
  description, 
  isEnabled, 
  onToggle 
}: SettingToggleProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <button 
        onClick={onToggle}
        className={`
          w-14 h-8 rounded-full p-1 transition-colors
          ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
        `}
      >
        <div 
          className={`
            w-6 h-6 rounded-full bg-white shadow-md transform transition-transform
            ${isEnabled ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export default SettingsModal;