
import React from 'react';
import type { ComparisonAnalysis, CandidateScreeningResult } from '../types';
import { Spinner } from './Spinner';
import { XCircleIcon } from './icons/XCircleIcon';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  data: ComparisonAnalysis | null;
  candidates: CandidateScreeningResult[];
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose, isLoading, error, data, candidates }) => {
  if (!isOpen) return null;

  const candidateNames = candidates.map(c => c.name);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/50"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Candidate Comparison
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XCircleIcon />
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Spinner />
              <p className="mt-4 text-slate-400">AI is comparing candidates...</p>
            </div>
          )}
          {error && <div className="text-center p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
          {data && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Overall Recommendation</h3>
                <p className="text-slate-400">{data.overall_recommendation}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700">
                            <th className="p-3 text-sm font-semibold text-slate-300 bg-slate-800/80 rounded-tl-lg w-1/4">Criteria</th>
                            {candidateNames.map((name, index) => (
                                <th key={name} className={`p-3 text-sm font-semibold text-slate-300 bg-slate-800/80 ${index === candidateNames.length - 1 ? 'rounded-tr-lg' : ''}`}>{name}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.comparison_table.map((row) => (
                            <tr key={row.criteria} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50">
                                <td className="p-3 font-medium text-slate-400 align-top">{row.criteria}</td>
                                {candidateNames.map(name => {
                                    const assessment = row.assessments.find(a => a.name === name);
                                    return (
                                        <td key={name} className="p-3 text-slate-300 align-top">
                                            {assessment ? assessment.assessment : <span className="text-slate-600">N/A</span>}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
