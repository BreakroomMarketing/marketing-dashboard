
// Formats YYYY-MM-DD to DD-Mon-YY, e.g., 15-Sep-24
export const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString + 'T00:00:00Z'); // Assume UTC if no timezone, treat as local for formatting.
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  } catch (e) {
    console.warn(`Error formatting date: ${dateString}`, e);
    return dateString; // fallback to original string
  }
};

// Formats numbers for display
export const formatNumberForDisplay = (
  value: number | undefined | null, 
  type: 'number' | 'currency' | 'percentage' = 'number',
  decimalPlaces: number = 2
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return type === 'percentage' ? '0.00%' : (type === 'currency' ? '£0.00' : '0');
  }

  if (type === 'percentage') {
    return `${value.toFixed(decimalPlaces)}%`;
  }
  
  if (type === 'currency') {
    return `£${value.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })}`;
  }

  // General number, potentially with fewer decimals if integer
  if (Number.isInteger(value) && type === 'number' && decimalPlaces === 0) {
     return value.toLocaleString();
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
};