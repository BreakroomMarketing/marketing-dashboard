
export interface RawMarketingDataEntry {
  date: string; // YYYY-MM-DD
  fbClicks: number;
  fbImpr: number;
  fbCost: number;
  fbConv: number;
  ttClicks: number;
  ttImpr: number;
  ttCost: number;
  ttConv: number;
}

export interface CalculatedMetrics {
  fbCtr: number;
  fbCpm: number;
  fbCpc: number;
  fbCpa: number;
  fbCvr: number;
  ttCtr: number; // Not in original list, but ttClicks / ttImpr
  ttCpm: number;
  ttCpc: number;
  ttCpa: number;
  ttCvr: number;
}

export interface ProcessedMarketingDataEntry extends RawMarketingDataEntry, CalculatedMetrics {
  // Date already in RawMarketingDataEntry, will be formatted for display
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean; // For AI messages being generated
  error?: string; // If AI message failed
}

export interface ApiError {
  message: string;
  code?: number; // Optional error code
}

// For Gemini Search Grounding (if used, example structure)
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // other types of chunks if applicable
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // other metadata fields
}