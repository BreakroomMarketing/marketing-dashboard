
import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from './components/DataTable';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ChatModal } from './components/ChatModal';
import { AppHeader } from './components/AppHeader'; // New component
import { DataControls } from './components/DataControls'; // New component
import { fetchLiveMarketingData } from './services/marketingDataService';
import { processApiData } from './utils/dataCalculations';
import type { ProcessedMarketingDataEntry } from './types'; // Removed ApiError from here as it's handled generally
import { APP_TITLE, FOOTER_TEXT, LIVE_DATA_TITLE, ASK_GEMINI_BUTTON_TEXT } from './constants';

const App: React.FC = () => {
  const [tableData, setTableData] = useState<ProcessedMarketingDataEntry[]>([]);
  const [isLoadingTableData, setIsLoadingTableData] = useState<boolean>(true);
  const [errorTableData, setErrorTableData] = useState<string | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState<boolean>(false);

  const loadDataForTable = useCallback(async (daysToLoad: number = 90) => { // Default to 90 days
    setIsLoadingTableData(true);
    setErrorTableData(null);
    try {
      const rawData = await fetchLiveMarketingData(daysToLoad); // Pass daysToLoad
      const processedData = processApiData(rawData);
      setTableData(processedData);
    } catch (err) {
      // Log the full error object for debugging in the console
      console.error("Caught error during data loading (raw object):", err);

      let displayMessage: string;

      if (err && typeof (err as any).message === 'string') {
        // Covers ApiError, standard Error instances, or any object with a string .message
        displayMessage = (err as any).message;
      } else if (typeof err === 'string') {
        // If the error thrown is just a string
        displayMessage = err;
      } else {
        // Fallback for other types of errors or if message is not a string
        displayMessage = "An unexpected error occurred while fetching data. Please check the console for more details.";
      }
      
      // Log the message that will be displayed in the UI for clarity
      console.error("Failed to load marketing data for table (UI message):", displayMessage);
      setErrorTableData(displayMessage);
    } finally {
      setIsLoadingTableData(false);
    }
  }, []);

  useEffect(() => {
    loadDataForTable(); // Initial load with default 90 days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDataForTable]); // loadDataForTable is memoized, so this runs once on mount

  const openChatModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); 
    setIsChatModalOpen(true);
  };
  const closeChatModal = () => setIsChatModalOpen(false);

  const handleRefreshData = () => {
    loadDataForTable(); // Refreshes with default 90 days
  };

  const handleLoadFullYear = () => {
    loadDataForTable(365); // Loads 365 days of data
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-8 font-sans">
      <AppHeader 
        title={APP_TITLE} 
        subtitle="Displaying simulated live data. Data updates on page load." 
      />

      <main className="space-y-8 sm:space-y-12">
        <section id="live-data" aria-labelledby="live-data-heading" className="bg-dark-card shadow-2xl rounded-lg p-4 sm:p-6">
          <DataControls
            sectionTitle={LIVE_DATA_TITLE}
            onRefreshData={handleRefreshData}
            onLoadFullYear={handleLoadFullYear} // Pass new handler
            onOpenChatModal={openChatModal}
            isRefreshingData={isLoadingTableData}
            askGeminiButtonText={ASK_GEMINI_BUTTON_TEXT}
            liveDataHeadingId="live-data-heading"
          />
          {isLoadingTableData && <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>}
          {errorTableData && <div role="alert" className="text-center text-red-400 bg-red-900/80 border border-red-700 p-4 rounded-md">{errorTableData}</div>}
          {!isLoadingTableData && !errorTableData && tableData.length > 0 && <DataTable data={tableData} />}
          {!isLoadingTableData && !errorTableData && tableData.length === 0 && <p className="text-center text-dark-text-secondary">No data available.</p>}
        </section>

        <ChatModal isOpen={isChatModalOpen} onClose={closeChatModal} tableData={tableData} />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>{FOOTER_TEXT} &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;