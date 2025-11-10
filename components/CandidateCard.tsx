
import React from 'react';
import type { CandidateScreeningResult } from '../types';

interface ScoreCircleProps {
    score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    
    let colorClass = 'text-green-400';
    if (score < 75) colorClass = 'text-yellow-400';
    if (score < 50) colorClass = 'text-red-400';

    return (
        <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="text-slate-700"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                />
                <circle
                    className={`${colorClass} transition-all duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    transform="rotate(-90 50 50)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-bold ${colorClass}`}>
                    {score}<span className="text-xl font-medium">%</span>
                </span>
                <span className="text-xs text-slate-400 mt-1">Matching Percentage</span>
            </div>
        </div>
    );
};


const InfoSection: React.FC<{ title: string; items: string[]; color: 'green' | 'yellow' | 'red' }> = ({ title, items, color }) => {
    if (items.length === 0) return null;

    const textColors = {
        green: 'text-green-300',
        yellow: 'text-yellow-300',
        red: 'text-red-300',
    }

    return (
        <div>
            <h4 className={`text-lg font-semibold mb-2 ${textColors[color]}`}>{title}</h4>
            <ul className={`list-disc list-inside space-y-1 pl-2 text-slate-300`}>
                {items.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};


interface CandidateCardProps {
  result: CandidateScreeningResult;
  isSelected: boolean;
  isSelectionDisabled: boolean;
  onSelect: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ result, isSelected, isSelectionDisabled, onSelect }) => {
  const cardClasses = [
    "bg-slate-800/50",
    "border",
    "rounded-2xl",
    "p-6",
    "shadow-md",
    "transition-all",
    "duration-300",
    "relative",
    isSelected ? "border-purple-500 shadow-purple-900/50" : "border-slate-700 hover:border-purple-600/50",
    isSelectionDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
  ].join(' ');

  const handleCardClick = () => {
    if (!isSelectionDisabled) {
      onSelect();
    }
  };

  return (
    <div className={cardClasses} onClick={handleCardClick}>
      <div className="absolute top-4 right-4">
        <input
            type="checkbox"
            checked={isSelected}
            disabled={isSelectionDisabled}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()} // prevent card click from firing twice
            className="h-6 w-6 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-6 mb-4">
        <ScoreCircle score={result.match_score} />
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-slate-100">{result.name}</h3>
          <p className="text-slate-400 mt-1">{result.summary}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <InfoSection title="Strengths" items={result.strengths} color="green" />
        <InfoSection title="Weaknesses" items={result.weaknesses} color="yellow" />
        {result.red_flags.length > 0 && 
            <div className="md:col-span-2 lg:col-span-1 xl:col-span-2">
                <InfoSection title="Red Flags" items={result.red_flags} color="red" />
            </div>
        }
      </div>
    </div>
  );
};