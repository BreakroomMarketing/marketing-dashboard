
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage as ChatMessageType, ProcessedMarketingDataEntry } from '../types'; // Removed ApiError as it's handled by backend
// import { MOCK_API_DELAY } from '../constants'; // MOCK_API_DELAY and GEMINI_API_KEY_ERROR_MESSAGE removed
// import { fetchLiveMarketingData } from '../services/marketingDataService'; // Removed as data comes from props
// import { processApiData } from '../utils/dataCalculations'; // Removed as data comes from props (already processed)
import { LoadingSpinner } from './LoadingSpinner';
import { ChatMessage } from './ChatMessageItem';

interface ChatAssistantProps {
  tableData: ProcessedMarketingDataEntry[]; // Prop to receive full dataset
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ tableData }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input field

  // Initialize with a greeting message
  useEffect(() => {
    setMessages([{
      id: Date.now().toString(),
      text: "Hello! I'm your expert Paid Social Media strategist. How can I help you analyze your campaign performance and provide actionable insights today?",
      sender: 'ai',
      timestamp: new Date()
    }]);
  }, []);

  // Focus input on mount (modal open) with preventScroll and delay
  useEffect(() => {
    const timerId = setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 100); // 100ms delay to allow modal to stabilize

    return () => clearTimeout(timerId); // Cleanup timer on unmount
  }, []); // Empty dependency array ensures this runs once on mount

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (input.trim() === '' || isLoadingAiResponse) return;

    const userInput: ChatMessageType = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Prepare history: filter out initial greeting if it's the only AI message, and any loading messages.
    // The history should represent actual conversational turns.
    const historyForBackend = messages.filter(msg => {
        if (msg.sender === 'ai' && messages.filter(m => m.sender === 'ai').length === 1 && msg.text.startsWith("Hello!")) {
            return false; // Don't include the initial greeting in history for the first user query
        }
        return !msg.isLoading;
    });

    setMessages(prev => [...prev, userInput]);
    const currentInput = input; // Capture input before clearing
    setInput('');
    setIsLoadingAiResponse(true);
    setError(null);

    const aiLoadingMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiLoadingMessageId,
      text: "Analyzing data and preparing insights...",
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      // Use the tableData prop directly (full 365-day processed data)
      // No need to fetchLiveMarketingData or processApiData here anymore.
      
      const response = await fetch('/api/ask-gemini', { // Updated path for Vercel
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userQuery: currentInput,
          history: historyForBackend,
          marketingData: tableData, // Use the full dataset from props
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      
      setMessages(prev => prev.map(msg => msg.id === aiLoadingMessageId ? {
        id: aiLoadingMessageId,
        text: responseData.reply,
        sender: 'ai',
        timestamp: new Date(),
        isLoading: false
      } : msg));

    } catch (e) {
      const err = e as Error;
      console.error("Error getting AI response:", err);
      setError(err.message || "An error occurred while talking to the AI.");
      setMessages(prev => prev.map(msg => msg.id === aiLoadingMessageId ? {
        id: aiLoadingMessageId,
        text: `Sorry, I encountered an error: ${err.message || "Unknown error"}. Please try again.`,
        sender: 'ai',
        timestamp: new Date(),
        isLoading: false,
        error: err.message
      } : msg));
    } finally {
      setIsLoadingAiResponse(false);
      // Re-focus input after response, without scrolling
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [input, isLoadingAiResponse, messages, tableData]); // Added tableData to dependency array

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission which can cause page reload/scroll
    sendMessage();
  };
  
  return (
    <div className="flex flex-col h-full w-full"> 
      <div className="flex-grow p-3 sm:p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {error && !isLoadingAiResponse && messages.length > 0 && !messages[messages.length-1].error && (
         <div role="alert" aria-live="assertive" className="p-2 text-xs text-red-400 border-t border-gray-700 mx-3 sm:mx-4">{error}</div>
      )}
      <div className="p-3 sm:p-4 border-t border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
          <input
            ref={inputRef} // Assign ref to input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoadingAiResponse ? "AI is responding..." : "Ask for strategic insights..."}
            className="flex-grow p-3 bg-gray-700 text-dark-text rounded-lg focus:ring-2 focus:ring-brand-primary focus:outline-none placeholder-gray-400"
            disabled={isLoadingAiResponse}
            aria-label="Chat input"
          />
          <button
            type="submit" // Changed to type="submit"
            disabled={isLoadingAiResponse || input.trim() === ''}
            className="p-3 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isLoadingAiResponse ? <LoadingSpinner size="w-5 h-5" /> : (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
