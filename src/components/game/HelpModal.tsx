// src/components/game/HelpModal.tsx
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">How to Play Pokédle</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <section>
            <h3 className="font-semibold mb-2">Game Objective</h3>
            <p>Guess the daily Pokémon in 8 tries or less!</p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">How to Play</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Type a Pokémon name in the search bar</li>
              <li>Select a Pokémon from the suggestions</li>
              <li>See how your guess compares to the target Pokémon</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Guess Indicators</h3>
            <ul className="space-y-2">
              <li>
                <span className="bg-green-200 px-2 py-1 rounded mr-2">Green</span>
                Exactly Correct
              </li>
              <li>
                <span className="bg-yellow-200 px-2 py-1 rounded mr-2">Yellow</span>
                Partially Correct
              </li>
              <li>
                <span className="bg-red-200 px-2 py-1 rounded mr-2">Red</span>
                Incorrect
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Hints</h3>
            <p>For numeric attributes like Height and Weight:</p>
            <ul className="list-disc list-inside">
              <li>↑ means the target is higher</li>
              <li>↓ means the target is lower</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Daily Challenge</h3>
            <p>A new Pokémon is available each day. Can you guess it?</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;