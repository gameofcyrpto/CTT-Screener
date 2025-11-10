
import React, { useState, useRef } from 'react';
import type { Resume } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { FileUploadIcon } from './icons/FileUploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface ResumeInputListProps {
  resumes: Resume[];
  setResumes: React.Dispatch<React.SetStateAction<Resume[]>>;
}

export const ResumeInputList: React.FC<ResumeInputListProps> = ({ resumes, setResumes }) => {
  const [isDragging, setIsDragging] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addResume = () => {
    setResumes(prev => [...prev, { id: Date.now(), content: '' }]);
  };

  const removeResume = (id: number) => {
    setResumes(prev => prev.filter(resume => resume.id !== id));
  };

  const updateResume = (id: number, value: string | File) => {
    setResumes(prev => prev.map(resume => {
      if (resume.id !== id) return resume;
      if (typeof value === 'string') {
        // If user starts typing, we assume they want to use text, so we clear the file.
        return { ...resume, content: value, file: undefined };
      }
      // If user uploads a file, we clear the text content.
      return { ...resume, content: '', file: value };
    }));
  };
  
  const handleFileChange = (id: number, files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        updateResume(id, file);
      } else {
        alert('Unsupported file type. Please upload a PDF or TXT file.\nWord documents are not supported, please save as a PDF first.');
      }
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(id);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    handleFileChange(id, e.dataTransfer.files);
  };

  return (
    <div>
      <label className="block text-lg font-semibold mb-2 text-slate-300">
        2. Add Candidate Resumes
      </label>
      <div className="space-y-4">
        {resumes.map((resume, index) => (
          <div key={resume.id} className="relative group">
            {resume.file ? (
              <div className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <DocumentIcon className="text-slate-400 h-8 w-8 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-slate-200 font-medium truncate" title={resume.file.name}>{resume.file.name}</p>
                    <p className="text-slate-500 text-sm">{(resume.file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => updateResume(resume.id, '')}
                  className="p-1.5 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors flex-shrink-0 ml-2"
                  aria-label="Remove file"
                >
                  <XCircleIcon />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(e, resume.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, resume.id)}
                className={`border-2 border-dashed border-slate-600 rounded-xl p-4 transition-colors duration-200 ${isDragging === resume.id ? 'bg-slate-700/50 border-purple-500' : 'bg-slate-900/50'}`}
              >
                <input
                  type="file"
                  ref={el => fileInputRefs.current[index] = el}
                  onChange={(e) => handleFileChange(resume.id, e.target.files)}
                  className="hidden"
                  accept=".pdf,.txt,application/pdf,text/plain"
                />
                <div className="text-center mb-3">
                  <FileUploadIcon className="mx-auto" />
                  <p className="mt-2 text-slate-400">
                    <button type="button" onClick={() => fileInputRefs.current[index]?.click()} className="font-semibold text-purple-400 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">
                      Click to upload
                    </button> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PDF or TXT. Word docs not supported.</p>
                </div>
                
                <div className="flex items-center my-3">
                  <div className="flex-grow border-t border-slate-700"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-xs uppercase">Or Paste Text</span>
                  <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <textarea
                  value={resume.content}
                  onChange={(e) => updateResume(resume.id, e.target.value)}
                  placeholder={`Paste resume for Candidate #${index + 1}...`}
                  rows={6}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 placeholder-slate-500"
                />
              </div>
            )}
            
            {resumes.length > 1 && (
              <button
                onClick={() => removeResume(resume.id)}
                className="absolute -top-2 -right-2 p-1.5 bg-slate-700 text-slate-400 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remove resume"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addResume}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-xl hover:bg-purple-900/60 transition-colors duration-200"
        >
          <PlusIcon />
          Add Another Candidate
        </button>
      </div>
    </div>
  );
};
