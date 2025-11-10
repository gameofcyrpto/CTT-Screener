import React from 'react';
import type { CandidateScreeningResult } from '../types';
import { CandidateCard } from './CandidateCard';
import { UsersIcon } from './icons/UsersIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ScreeningResultsProps {
  results: CandidateScreeningResult[];
  selectedForCompare: CandidateScreeningResult[];
  onSelectForCompare: (result: CandidateScreeningResult) => void;
  onCompare: () => void;
}

export const ScreeningResults: React.FC<ScreeningResultsProps> = ({ results, selectedForCompare, onSelectForCompare, onCompare }) => {
  const sortedResults = [...results].sort((a, b) => b.match_score - a.match_score);
  const selectedCount = selectedForCompare.length;
  const isCompareDisabled = selectedCount < 2 || selectedCount > 5;
  
  const getCompareButtonText = () => {
    if (selectedCount === 0) return 'Select 2 to 5 Candidates to Compare';
    if (selectedCount === 1) return `Select ${2 - selectedCount} more candidate to compare`;
    return `Compare ${selectedCount} Candidates`;
  }

  const escapeCsvCell = (cellData: any) => {
    if (typeof cellData === 'string' && (cellData.includes(',') || cellData.includes('\n') || cellData.includes('"'))) {
      return `"${cellData.replace(/"/g, '""')}"`;
    }
    if (Array.isArray(cellData)) {
        return `"${cellData.join('\n').replace(/"/g, '""')}"`;
    }
    return cellData;
  };

  const handleExportCSV = () => {
    const headers = [
        'Rank',
        'Name',
        'Matching Percentage',
        'Summary',
        'Strengths',
        'Weaknesses',
        'Red Flags'
    ];
    
    const rows = sortedResults.map((res, index) => [
      index + 1,
      res.name,
      res.match_score,
      res.summary,
      res.strengths,
      res.weaknesses,
      res.red_flags
    ]);

    const csvContent = headers.map(h => escapeCsvCell(h)).join(",") + "\n"
        + rows.map(row => row.map(cell => escapeCsvCell(cell)).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "resume-screening-results.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-200">Screening Results</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {results.length > 0 && (
                 <button
                    onClick={handleExportCSV}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-400/50 shadow-lg"
                 >
                    <DownloadIcon />
                    Export as CSV
                </button>
            )}
            {results.length > 1 && (
            <button
                onClick={onCompare}
                disabled={isCompareDisabled}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 shadow-lg disabled:shadow-none"
            >
                <UsersIcon />
                {getCompareButtonText()}
            </button>
            )}
        </div>
      </div>
       
      {sortedResults.map((result, index) => {
          const isSelected = selectedForCompare.some(r => r.name === result.name);
          const isSelectionDisabled = !isSelected && selectedCount >= 5;
          return (
            <CandidateCard
              key={result.name || index}
              result={result}
              isSelected={isSelected}
              isSelectionDisabled={isSelectionDisabled}
              onSelect={() => onSelectForCompare(result)}
            />
          );
      })}
    </div>
  );
};