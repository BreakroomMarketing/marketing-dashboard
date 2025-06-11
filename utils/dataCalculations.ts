
import type { RawMarketingDataEntry, ProcessedMarketingDataEntry, CalculatedMetrics } from '../types';

const calculateMetric = (numerator: number, denominator: number, multiplier: number = 1): number => {
  if (denominator === 0) return 0;
  return (numerator / denominator) * multiplier;
};

export const calculateAllMetrics = (entry: RawMarketingDataEntry): CalculatedMetrics => {
  const fbCtr = calculateMetric(entry.fbClicks, entry.fbImpr, 100); // Percentage
  const fbCpm = calculateMetric(entry.fbCost, entry.fbImpr, 1000);
  const fbCpc = calculateMetric(entry.fbCost, entry.fbClicks);
  const fbCpa = calculateMetric(entry.fbCost, entry.fbConv);
  const fbCvr = calculateMetric(entry.fbConv, entry.fbClicks, 100); // Percentage

  const ttCtr = calculateMetric(entry.ttClicks, entry.ttImpr, 100); // Percentage. Added as it's a standard metric.
  const ttCpm = calculateMetric(entry.ttCost, entry.ttImpr, 1000);
  const ttCpc = calculateMetric(entry.ttCost, entry.ttClicks);
  const ttCpa = calculateMetric(entry.ttCost, entry.ttConv);
  const ttCvr = calculateMetric(entry.ttConv, entry.ttClicks, 100); // Percentage

  return {
    fbCtr,
    fbCpm,
    fbCpc,
    fbCpa,
    fbCvr,
    ttCtr,
    ttCpm,
    ttCpc,
    ttCpa,
    ttCvr,
  };
};

export const processApiData = (rawData: RawMarketingDataEntry[]): ProcessedMarketingDataEntry[] => {
  return rawData.map(entry => {
    const calculatedMetrics = calculateAllMetrics(entry);
    return {
      ...entry,
      ...calculatedMetrics,
    };
  });
};