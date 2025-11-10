import React, { useState, useCallback } from 'react';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResumeInputList } from './components/ResumeInputList';
import { ScreeningResults } from './components/ScreeningResults';
import { Spinner } from './components/Spinner';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { screenCandidates, compareCandidates } from './services/geminiService';
import type { CandidateScreeningResult, Resume, ComparisonAnalysis } from './types';
import { ComparisonModal } from './components/ComparisonModal';

export default function App() {
  const [jobDescription, setJobDescription] = useState<string | File>('');
  const [resumes, setResumes] = useState<Resume[]>([
    { id: 1, content: '' },
  ]);
  const [results, setResults] = useState<CandidateScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for comparison feature
  const [selectedForCompare, setSelectedForCompare] = useState<CandidateScreeningResult[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonAnalysis | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);


  const isJobDescriptionProvided = (typeof jobDescription === 'string' && !!jobDescription.trim()) || jobDescription instanceof File;
  const areResumesProvided = resumes.some(r => !!r.content.trim() || r.file);

  const handleScreenCandidates = useCallback(async () => {
    const resumesToProcess = resumes.filter(r => r.content.trim() || r.file);
    if (!isJobDescriptionProvided || resumesToProcess.length === 0) {
      setError('Please provide a job description and at least one resume.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setSelectedForCompare([]); // Reset selection

    try {
      const screeningResults = await screenCandidates(jobDescription, resumesToProcess);
      setResults(screeningResults);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [jobDescription, resumes, isJobDescriptionProvided]);
  
  const isButtonDisabled = isLoading || !isJobDescriptionProvided || !areResumesProvided;

  const handleSelectForCompare = useCallback((result: CandidateScreeningResult) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(r => r.name === result.name);
      if (isSelected) {
        return prev.filter(r => r.name !== result.name);
      } else {
        if (prev.length < 5) {
          return [...prev, result];
        }
        return prev; // Don't add more than 5
      }
    });
  }, []);

  const handleCompare = async () => {
    if (selectedForCompare.length < 2) {
      setCompareError("Please select at least 2 candidates to compare.");
      return;
    }

    setIsComparing(true);
    setCompareError(null);
    setComparisonResult(null);
    setIsCompareModalOpen(true);

    try {
      const analysis = await compareCandidates(jobDescription, selectedForCompare);
      setComparisonResult(analysis);
    } catch (e) {
      console.error(e);
      setCompareError(e instanceof Error ? e.message : 'An unknown error occurred during comparison.');
    } finally {
      setIsComparing(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
            CTT Resume Screener
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Instantly analyze and rank candidates by providing a job description and their resumes.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-lg">
            <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
            <ResumeInputList resumes={resumes} setResumes={setResumes} />
          </div>

          <div className="lg:sticky lg:top-8 flex flex-col gap-6">
            <button
              onClick={handleScreenCandidates}
              disabled={isButtonDisabled}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400/50 shadow-lg disabled:shadow-none"
            >
              <SparklesIcon />
              {isLoading ? 'Analyzing...' : 'Screen Candidates'}
            </button>
            
            {error && <div className="text-center p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700">
                <Spinner />
                <p className="mt-4 text-slate-400">AI is analyzing the documents...</p>
              </div>
            )}
            
            {!isLoading && results.length > 0 && (
              <ScreeningResults 
                results={results}
                selectedForCompare={selectedForCompare}
                onSelectForCompare={handleSelectForCompare}
                onCompare={handleCompare}
              />
            )}
            
            {!isLoading && results.length === 0 && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                    <SparklesIcon className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300">Awaiting Analysis</h3>
                    <p className="text-slate-500 mt-1">Your candidate screening results will appear here.</p>
                </div>
            )}
          </div>
        </div>
      </main>
      <ComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        isLoading={isComparing}
        error={compareError}
        data={comparisonResult}
        candidates={selectedForCompare}
      />
    </div>
  );
}