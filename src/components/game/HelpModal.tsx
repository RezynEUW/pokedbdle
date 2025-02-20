// src/components/game/HelpModal.tsx - Escaped apostrophes
import React from 'react';
import Modal from '../ui/Modal';
import './Modal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="How to Play Pokédle"
    >
      <section className="modal-section">
        <h3 className="section-title">Game Objective</h3>
        <p>
          Guess the daily Pokémon in as few tries as possible. You have unlimited guesses!
          Try to maintain your streak by guessing each day&apos;s Pokémon.
        </p>
      </section>

      <section className="modal-section">
        <h3 className="section-title">How to Play</h3>
        <ol className="numbered-list">
          <li>
            Type a Pokémon name in the search bar and select from the suggestions that appear
          </li>
          <li>
            After submitting your guess, the game will show how your guess compares to the target Pokémon across multiple attributes
          </li>
          <li>
            Use the information from previous guesses to narrow down possibilities
          </li>
          <li>
            The game updates daily at midnight local time
          </li>
        </ol>
      </section>

      <section className="modal-section">
        <h3 className="section-title">The Random Button</h3>
        <p>
          Not sure where to start? You can use the random button up to 5 times per day:
        </p>
        <ul className="bullet-list">
          <li>The random button provides a valid guess from the Pokédex</li>
          <li>It&apos;s a great way to get started or if you&apos;re stuck</li>
          <li>Your daily allowance resets at midnight</li>
        </ul>
      </section>

      <section className="modal-section">
        <h3 className="section-title">Guess Indicators</h3>
        <ul className="indicator-list">
          <li className="indicator-item">
            <span className="indicator correct"></span>
            <span><strong>Green:</strong> Exactly correct</span>
          </li>
          <li className="indicator-item">
            <span className="indicator partial"></span>
            <span><strong>Yellow:</strong> Partially correct (e.g., one type matches)</span>
          </li>
          <li className="indicator-item">
            <span className="indicator incorrect"></span>
            <span><strong>Red:</strong> Incorrect</span>
          </li>
        </ul>
      </section>

      <section className="modal-section">
        <h3 className="section-title">Tips & Strategies</h3>
        <ul className="bullet-list">
          <li>Start with popular Pokémon from different generations</li>
          <li>Pay attention to the numeric hints (↑/↓) to narrow down height, weight, and BST</li>
          <li>Use the random button strategically if you&apos;re not sure where to start</li>
        </ul>
      </section>
    </Modal>
  );
}

export default HelpModal;