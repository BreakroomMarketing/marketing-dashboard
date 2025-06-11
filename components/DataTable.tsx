
import React from 'react';
import type { ProcessedMarketingDataEntry } from '../types';
import { TABLE_COLUMN_HEADERS } from '../constants';
import { formatDateForDisplay, formatNumberForDisplay } from '../utils/formatting';

interface DataTableProps {
  data: ProcessedMarketingDataEntry[];
}

type SortableKeys = keyof ProcessedMarketingDataEntry;

// Define TikTok column keys
const TIKTOK_COLUMN_KEYS: SortableKeys[] = [
  'ttClicks', 'ttImpr', 'ttCost', 'ttConv', 
  'ttCtr', 'ttCpm', 'ttCpc', 'ttCpa', 'ttCvr'
];

// Helper function to check if a column is a TikTok column
const isTikTokColumn = (key: SortableKeys): boolean => {
  return TIKTOK_COLUMN_KEYS.includes(key);
};

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending'});

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (sortConfig.key === 'date' && typeof valA === 'string' && typeof valB === 'string') {
          const timeA = new Date(valA).getTime();
          const timeB = new Date(valB).getTime();

          const isTimeAValid = !isNaN(timeA);
          const isTimeBValid = !isNaN(timeB);

          if (!isTimeAValid && !isTimeBValid) return 0; // Both invalid, treat as equal
          if (!isTimeAValid) return sortConfig.direction === 'ascending' ? -1 : 1; // Invalid A first/last
          if (!isTimeBValid) return sortConfig.direction === 'ascending' ? 1 : -1; // Invalid B first/last

          if (timeA < timeB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (timeA > timeB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (typeof valA === 'number' && typeof valB === 'number') {
           if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
          // For other strings (none in current data that are numeric like)
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Fallback for mixed types or other types (should not happen with current data)
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="opacity-50">↕</span>;
    }
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };
  
  const columns: { key: SortableKeys; header: string; type: 'string' | 'number' | 'percentage' | 'currency' | 'date' }[] = [
    { key: 'date', header: TABLE_COLUMN_HEADERS.date, type: 'date' },
    { key: 'fbClicks', header: TABLE_COLUMN_HEADERS.fbClicks, type: 'number' },
    { key: 'fbImpr', header: TABLE_COLUMN_HEADERS.fbImpr, type: 'number' },
    { key: 'fbCost', header: TABLE_COLUMN_HEADERS.fbCost, type: 'currency' },
    { key: 'fbConv', header: TABLE_COLUMN_HEADERS.fbConv, type: 'number' },
    { key: 'fbCtr', header: TABLE_COLUMN_HEADERS.fbCtr, type: 'percentage' },
    { key: 'fbCpm', header: TABLE_COLUMN_HEADERS.fbCpm, type: 'currency' },
    { key: 'fbCpc', header: TABLE_COLUMN_HEADERS.fbCpc, type: 'currency' },
    { key: 'fbCpa', header: TABLE_COLUMN_HEADERS.fbCpa, type: 'currency' },
    { key: 'fbCvr', header: TABLE_COLUMN_HEADERS.fbCvr, type: 'percentage' }, // Last FB column
    { key: 'ttClicks', header: TABLE_COLUMN_HEADERS.ttClicks, type: 'number' }, // First TT column
    { key: 'ttImpr', header: TABLE_COLUMN_HEADERS.ttImpr, type: 'number' },
    { key: 'ttCost', header: TABLE_COLUMN_HEADERS.ttCost, type: 'currency' },
    { key: 'ttConv', header: TABLE_COLUMN_HEADERS.ttConv, type: 'number' },
    { key: 'ttCtr', header: TABLE_COLUMN_HEADERS.ttCtr, type: 'percentage' },
    { key: 'ttCpm', header: TABLE_COLUMN_HEADERS.ttCpm, type: 'currency' },
    { key: 'ttCpc', header: TABLE_COLUMN_HEADERS.ttCpc, type: 'currency' },
    { key: 'ttCpa', header: TABLE_COLUMN_HEADERS.ttCpa, type: 'currency' },
    { key: 'ttCvr', header: TABLE_COLUMN_HEADERS.ttCvr, type: 'percentage' },
  ];


  if (!data.length) {
    return <p className="text-center text-dark-text-secondary py-8">No data to display.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md shadow-md">
      <table className="min-w-full divide-y divide-gray-700 bg-dark-card">
        <thead className="sticky top-0 z-10 bg-gray-700">
          <tr>
            {columns.map((col) => {
              let thClassName = "px-4 py-3.5 text-left text-xs sm:text-sm font-semibold text-dark-text-secondary uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors";
              if (col.key === 'fbCvr') {
                thClassName += " border-r border-slate-500";
              }
              if (isTikTokColumn(col.key)) {
                thClassName += " bg-slate-600"; // Subtly lighter than bg-gray-700
              }
              return (
                <th
                  key={col.key}
                  scope="col"
                  onClick={() => requestSort(col.key)}
                  className={thClassName}
                >
                  <div className="flex items-center">
                    {col.header}
                    <span className="ml-1 text-xs">{getSortIndicator(col.key)}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-600">
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-700/50 transition-colors">
              {columns.map((col) => {
                let tdClassName = "px-4 py-3.5 text-xs sm:text-sm text-dark-text-secondary whitespace-nowrap";
                if (col.key === 'fbCvr') {
                  tdClassName += " border-r border-slate-500";
                }
                if (isTikTokColumn(col.key)) {
                  tdClassName += " bg-slate-700"; // Subtly lighter than bg-dark-card (gray-800)
                }
                return (
                  <td key={col.key} className={tdClassName}>
                    {col.type === 'date' ? formatDateForDisplay(row[col.key] as string) : 
                     col.type === 'percentage' ? formatNumberForDisplay(row[col.key] as number, 'percentage') :
                     col.type === 'currency' ? formatNumberForDisplay(row[col.key] as number, 'currency') :
                     formatNumberForDisplay(row[col.key] as number, 'number')
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};