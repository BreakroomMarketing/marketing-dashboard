import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface DataControlsProps {
  sectionTitle: string;
  onRefreshData: () => void;
  onLoadFullYear: () => void; // New prop for loading full year data
  onOpenChatModal: (event: React.MouseEvent<HTMLButtonElement>) => void;
  isRefreshingData: boolean;
  askGeminiButtonText: string;
  liveDataHeadingId: string; 
  refreshButtonText?: string;
  loadFullYearButtonText?: string; // New prop for button text
}

export const DataControls: React.FC<DataControlsProps> = ({
  sectionTitle,
  onRefreshData,
  onLoadFullYear, // Destructure new prop
  onOpenChatModal,
  isRefreshingData,
  askGeminiButtonText,
  liveDataHeadingId,
  refreshButtonText = "Refresh Data",
  loadFullYearButtonText = "Load Full Year" // Default text for new button
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
      <h2 id={liveDataHeadingId} className="text-xl sm:text-2xl font-semibold text-brand-primary">
        {sectionTitle}
      </h2>
      <div className="flex flex-wrap space-x-3">
        <button
          onClick={onRefreshData}
          disabled={isRefreshingData}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-medium rounded-md text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          aria-label={refreshButtonText}
          aria-live="polite" 
        >
          {isRefreshingData ? (
            <LoadingSpinner size="w-4 h-4" className="mr-2"/>
          ) : (
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          )}
          {refreshButtonText}
        </button>
        <button
          onClick={onLoadFullYear} // Attach new handler
          disabled={isRefreshingData} // Reuse the same loading state
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-md text-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          aria-label={loadFullYearButtonText}
        >
          {/* You can add an icon here if desired, similar to the refresh button */}
           <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {loadFullYearButtonText}
        </button>
        <button
          onClick={onOpenChatModal}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md text-sm transition-colors duration-150 flex items-center"
          aria-label={askGeminiButtonText}
        >
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.154 48.154 0 0 0 5.433-.377c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          {askGeminiButtonText}
        </button>
      </div>
    </div>
  );
};