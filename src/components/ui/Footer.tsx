// src/components/ui/Footer.tsx
import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section privacy-section">
          <h3>Privacy Information</h3>
          <p>
            Pokédle uses browser storage to remember your game progress, streak, and preferences.
            No personal data is collected or shared with third parties.
          </p>
          <p>
            Your game state is stored locally on your device to let you continue where you left off
            and to track your daily streak.
          </p>
        </div>
        
        <div className="footer-section disclaimer-section">
          <h3>Disclaimer</h3>
          <p>
            Pokédle is a fan project and is not affiliated with, endorsed, sponsored, or approved by 
            Nintendo, The Pokémon Company, or Game Freak.
          </p>
          <p>
            All Pokémon content and images are property of their respective owners.
          </p>
          <p>
            Pokémon data sourced from <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a>.
          </p>
        </div>
        
        <div className="footer-section credits-section">
          <h3>About</h3>
          <p>
            Created with ❤️ for Pokémon fans everywhere.
          </p>
          <p>
            Reach out: <a href="mailto:contact@pokedle.day">contact@pokedle.day</a>
          </p>
          <div className="tech-stack">
            <h4></h4>
            <ul>
              <li>Next.js 15</li>
              <li>TypeScript</li>
              <li>Neon.tech PostgreSQL</li>
              <li>React</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;