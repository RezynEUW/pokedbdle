// src/components/ui/Modal.tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../game/Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Create portal to render modal outside of current component hierarchy
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-container">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close-button" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body // Mount directly to document body
  );
}

export default Modal;