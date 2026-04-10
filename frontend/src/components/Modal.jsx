import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative glass-panel rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 indigo-glow border-white/5">
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
