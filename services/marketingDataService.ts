import type { RawMarketingDataEntry } from '../types';

// Simulates fetching live data by calling a backend endpoint.
export const fetchLiveMarketingData = async (days: number = 90): Promise<RawMarketingDataEntry[]> => {
  // The 'days' parameter will be passed as a query string.
  try {
    const response = await fetch(`/api/get-live-data?days=${days}`);

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Failed to parse JSON error response, stick with original HTTP error
        console.warn('Could not parse error response JSON from /api/get-live-data', e);
      }
      throw new Error(`Failed to fetch marketing data: ${errorMessage}`);
    }

    const data: RawMarketingDataEntry[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error in fetchLiveMarketingData:', error);
    // Re-throw the error so it can be caught by the calling component (App.tsx)
    // which has existing UI error handling.
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unknown error occurred while fetching marketing data.');
  }
};