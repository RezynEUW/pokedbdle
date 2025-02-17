// src/components/ui/Modal.tsx
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none"
      onClick={onClose}
    >
      <div 
        className={`relative w-auto max-w-3xl mx-auto my-6 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {title && (
            <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-slate-200">
              <h3 className="text-3xl font-semibold">{title}</h3>
              <button
                className="float-right p-1 ml-auto text-3xl font-semibold leading-none text-black bg-transparent border-0 outline-none opacity-5 focus:outline-none"
                onClick={onClose}
              >
                <span className="block w-6 h-6 text-2xl text-black bg-transparent opacity-5">
                  ×
                </span>
              </button>
            </div>
          )}
          <div className="relative flex-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;