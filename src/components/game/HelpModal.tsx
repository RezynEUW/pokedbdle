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
            After submitting your guess, the game will show how your guess compares to the target Pokémon
          </li>
          <li>
            Use the feedback from previous guesses to narrow down possibilities
          </li>
          <li>
            The game updates daily at midnight local time
          </li>
        </ol>
      </section>

      <section className="modal-section">
        <h3 className="section-title">Guess Categories</h3>
        <ul className="bullet-list">
          <li><strong>Type:</strong> The Pokémon&apos;s elemental type(s). Yellow means one type matches.</li>
          <li><strong>Generation:</strong> When the Pokémon was introduced (Gen 1-9).</li>
          <li><strong>Color:</strong> The Pokémon&apos;s primary color classification in the Pokédex.</li>
          <li><strong>Evolution:</strong> Whether it&apos;s a basic, stage 1, stage 2, or special evolution.</li>
          <li><strong>Height:</strong> The Pokémon&apos;s height in meters (arrows indicate higher/lower).</li>
          <li><strong>Weight:</strong> The Pokémon&apos;s weight in kg (arrows indicate higher/lower).</li>
          <li><strong>BST:</strong> Base Stat Total, the sum of all base stats (arrows indicate higher/lower).</li>
          <li><strong>Egg Group:</strong> Breeding compatibility categories. Yellow means one group matches.</li>
          <li><strong>Abilities:</strong> Special powers. Yellow means one ability matches.</li>
        </ul>
      </section>

      <section className="modal-section">
        <h3 className="section-title">Generation Selection</h3>
        <p>
          You can filter the game to only include Pokémon from specific generations:
        </p>
        <ul className="bullet-list">
          <li>Use the generation buttons on the right side of the header</li>
          <li>Select any combination of generations you know best</li>
          <li>When playing with filtered generations, you may get a different daily Pokémon than other players</li>
        </ul>
      </section>

      <section className="modal-section">
        <h3 className="section-title">The Random Button</h3>
        <p>
          Not sure where to start? You can use the random button up to 5 times per day:
        </p>
        <ul className="bullet-list">
          <li>The random button provides a valid guess from your selected generations</li>
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
            <span><strong>Yellow:</strong> Partially correct or in range</span>
          </li>
          <li className="indicator-item">
            <span className="indicator incorrect"></span>
            <span><strong>Red:</strong> Incorrect</span>
          </li>
          <li className="indicator-item">
            <span>↑: Target Pokémon has a higher value</span>
          </li>
          <li className="indicator-item">
            <span>↓: Target Pokémon has a lower value</span>
          </li>
        </ul>
      </section>

      <section className="modal-section">
        <h3 className="section-title">Tips & Strategies</h3>
        <ul className="bullet-list">
          <li>Start with Pokémon that have diverse types and egg groups</li>
          <li>Pay attention to the numeric hints (↑/↓) to narrow down height, weight, and BST</li>
          <li>If you&apos;re only familiar with certain generations, use the generation filter</li>
          <li>Remember that dual-type Pokémon will show yellow if one type matches</li>
          <li>Use the random button strategically to explore unfamiliar categories</li>
        </ul>
      </section>
    </Modal>
  );
}

export default HelpModal;