
import React, { useEffect, useRef } from 'react';
import { ChatAssistant } from './ChatAssistant';
import { AI_ASSISTANT_TITLE } from '../constants';
import type { ProcessedMarketingDataEntry } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData: ProcessedMarketingDataEntry[]; // Added prop to receive main table data
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, tableData }) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null); // Ref remains for the button itself

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      document.addEventListener('keydown', handleEscapeKey);
      // REMOVED: closeButtonRef.current?.focus(); 
      // ChatAssistant will handle focusing its own input.
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out overscroll-contain" // Added overscroll-contain
      aria-labelledby="chat-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close on overlay click
    >
      <div 
        ref={modalContentRef}
        className="bg-dark-card rounded-lg shadow-2xl p-0 w-full max-w-2xl mx-4 sm:mx-auto flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <header className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-700">
          <h2 id="chat-modal-title" className="text-lg sm:text-xl font-semibold text-brand-primary">
            {AI_ASSISTANT_TITLE}
          </h2>
          <button
            ref={closeButtonRef} // Keep ref for accessibility attributes if needed, but not for programmatic focus here
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-dark-card"
            aria-label="Close chat assistant"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="flex-grow overflow-hidden">
          <ChatAssistant tableData={tableData} /> {/* Pass tableData to ChatAssistant */}
        </div>
      </div>
    </div>
  );
};
