import React from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  const baseBubbleClasses = "p-3 rounded-xl max-w-[80%] shadow-md break-words";
  const userBubbleClasses = "bg-brand-primary text-white self-end";
  const aiBubbleClasses = "bg-gray-700 text-dark-text-secondary self-start";

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`${baseBubbleClasses} ${isUser ? userBubbleClasses : aiBubbleClasses}`}>
        {message.isLoading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="w-4 h-4" color="text-gray-300" />
            <span className="text-sm text-gray-300">{message.text}</span>
          </div>
        ) : message.error ? (
          <div className="text-red-300">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{message.text}</p>
          </div>
        ) : (
          <p className="text-sm sm:text-base whitespace-pre-wrap">{message.text}</p>
        )}
      </div>
      {/* Timestamp removed as per request */}
      {/* 
      <span className={`text-xs mt-1 ${isUser ? 'text-gray-500' : 'text-gray-400'}`}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span> 
      */}
    </div>
  );
};