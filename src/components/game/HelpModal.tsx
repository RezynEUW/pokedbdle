import React from 'react';
import Modal from '../ui/Modal';
import Image from 'next/image';
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
      title="Master Pokédle - Trainer's Guide"
    >
      <section className="modal-section intro-section">
        <div className="intro-flex">
          <div className="intro-text">
            <h3 className="section-title gradient-title">Your Pokédex Challenge Awaits</h3>
            <p className="intro-description">
              Put your Pokémon knowledge to the ultimate test! Identify the mystery Pokémon using strategic guesses and deductive reasoning. 
              Every guess reveals more information, bringing you closer to becoming a true Pokémon Master.
            </p>
          </div>
          <div className="pokeball-icon">
            <div className="pokeball-inner"></div>
          </div>
        </div>
      </section>

      <section className="modal-section game-flow-section">
        <h3 className="section-title">The Pokédle Challenge</h3>
        <div className="game-steps">
          <div className="game-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Search & Select</h4>
              <p>Enter a Pokémon name in the search bar and choose from the suggestions.</p>
            </div>
          </div>
          <div className="game-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Analyze Feedback</h4>
              <p>Examine how your guess compares to the target across nine different categories.</p>
            </div>
          </div>
          <div className="game-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Refine Strategy</h4>
              <p>Use the color-coded hints to narrow down possibilities with each new guess.</p>
            </div>
          </div>
          <div className="game-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Return Daily</h4>
              <p>A new Pokémon appears at midnight — build your streak by playing every day!</p>
            </div>
          </div>
        </div>
      </section>

      <section className="modal-section categories-section">
        <h3 className="section-title">Unraveling the Clues</h3>
        <div className="categories-grid">
          <div className="category-card">
            <h4 className="category-name">Type</h4>
            <p className="category-description">Elemental classifications like Fire, Water, or Grass. Yellow indicates a partial match (one type matches in dual-type Pokémon).</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Generation</h4>
            <p className="category-description">The game release era when the Pokémon debuted (Gen 1-9). Helps narrow down the time period.</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Color</h4>
            <p className="category-description">The Pokédex color categorization — not always the most prominent visual color!</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Evolution</h4>
            <p className="category-description">Whether it's a basic Pokémon, Stage 1, Stage 2, or special evolutionary form.</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Height & Weight</h4>
            <p className="category-description">Physical dimensions with directional arrows (↑/↓) showing if the target is larger or smaller.</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">BST (Base Stat Total)</h4>
            <p className="category-description">Sum of all base stats, indicating overall power level. Higher numbers typically suggest legendary status.</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Egg Groups</h4>
            <p className="category-description">Breeding compatibility categories. Useful for narrowing down evolutionary families.</p>
          </div>
          <div className="category-card">
            <h4 className="category-name">Abilities</h4>
            <p className="category-description">Special powers that affect battle mechanics. Yellow means one ability matches.</p>
          </div>
        </div>
      </section>

      <section className="modal-section indicators-section">
        <h3 className="section-title">Decoding the Signals</h3>
        <div className="indicators-flex">
          <div className="indicators-column">
            <div className="indicator-item">
              <span className="indicator correct"></span>
              <div className="indicator-content">
                <h4>Perfect Match</h4>
                <p>This attribute is exactly correct! You've identified a key characteristic.</p>
              </div>
            </div>
            <div className="indicator-item">
              <span className="indicator partial"></span>
              <div className="indicator-content">
                <h4>Partial Match</h4>
                <p>You're close! Either one element matches (for multi-element attributes) or the value is within range.</p>
              </div>
            </div>
            <div className="indicator-item">
              <span className="indicator incorrect"></span>
              <div className="indicator-content">
                <h4>No Match</h4>
                <p>This attribute doesn't match the target Pokémon. Try a different approach!</p>
              </div>
            </div>
          </div>
          <div className="indicators-column">
            <div className="direction-indicator">
              <div className="direction-symbol">↑</div>
              <p>The target Pokémon has a <strong>higher value</strong> (for Height, Weight, or BST)</p>
            </div>
            <div className="direction-indicator">
              <div className="direction-symbol">↓</div>
              <p>The target Pokémon has a <strong>lower value</strong> (for Height, Weight, or BST)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="modal-section features-section">
        <h3 className="section-title">Special Features</h3>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon gen-icon"></div>
            <div className="feature-content">
              <h4>Generation Selection</h4>
              <p>Focus on eras you know best! Filter to include only Pokémon from specific generations using the buttons in the header. This creates a customized challenge unique to your selection.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon random-icon"></div>
            <div className="feature-content">
              <h4>Random Assist</h4>
              <p>Stuck or starting out? Use the random button (up to 5 times daily) to get valid guesses from your selected generations. A strategic tool when you need inspiration!</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon hint-icon"></div>
            <div className="feature-content">
              <h4>Progressive Hints</h4>
              <p>After multiple attempts, unlock special hints that provide additional clues about the mystery Pokémon. Check the hint buttons that appear after reaching guess thresholds.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon shiny-icon"></div>
            <div className="feature-content">
              <h4>Daily Shiny Chance</h4>
              <p>One Pokémon per day has a special shiny appearance! Will you notice which one stands out from the rest? Keep an eye out for this rare variation in your guesses.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="modal-section strategy-section">
        <h3 className="section-title">Trainer Strategies</h3>
        <div className="strategy-flexbox">
          <div className="strategy-card">
            <h4 className="strategy-title">Diverse First Guess</h4>
            <p>Start with Pokémon that have unusual type combinations, diverse egg groups, or distinctive stats to maximize information gain.</p>
          </div>
          <div className="strategy-card">
            <h4 className="strategy-title">Evolutionary Logic</h4>
            <p>Once you know the evolution stage, you can eliminate entire evolutionary lines that don't fit the pattern.</p>
          </div>
          <div className="strategy-card">
            <h4 className="strategy-title">BST Insight</h4>
            <p>BST ranges can quickly identify if you're looking for a legendary (550+), pseudo-legendary (~600), or standard Pokémon.</p>
          </div>
          <div className="strategy-card">
            <h4 className="strategy-title">Type Triangulation</h4>
            <p>After finding a matching type, try Pokémon with different secondary types to pinpoint dual-type combinations.</p>
          </div>
          <div className="strategy-card">
            <h4 className="strategy-title">Generation Focus</h4>
            <p>If you're more familiar with certain generations, use the filter to create a more manageable playing field.</p>
          </div>
          <div className="strategy-card">
            <h4 className="strategy-title">Process of Elimination</h4>
            <p>Keep track of ruled-out attributes between guesses to systematically narrow down possibilities.</p>
          </div>
        </div>
      </section>

      <section className="modal-section pro-tips">
        <h3 className="section-title">Pro Trainer Tips</h3>
        <ul className="enhanced-bullet-list">
          <li>
            <span className="bullet-highlight">Daily Streak Bonus: </span> 
            Playing every day increases your streak counter, showing your dedication as a Pokémon Master.
          </li>
          <li>
            <span className="bullet-highlight">Community Challenge: </span> 
            Compare your guessing strategy with friends to see who can solve the Pokédle in fewer attempts!
          </li>
          <li>
            <span className="bullet-highlight">Memory Building: </span> 
            Consider taking notes on patterns you discover to improve your strategy over time.
          </li>
          <li>
            <span className="bullet-highlight">Shiny Hunting: </span> 
            Each day has one special Pokémon that appears as a shiny in your guesses—can you find it?
          </li>
          <li>
            <span className="bullet-highlight">Midnight Reset: </span> 
            Come back after midnight local time for a fresh challenge and to maintain your streak.
          </li>
        </ul>
      </section>
    </Modal>
  );
}

export default HelpModal;