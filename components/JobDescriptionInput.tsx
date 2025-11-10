
import React, { useState, useRef } from 'react';
import { FileUploadIcon } from './icons/FileUploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface JobDescriptionInputProps {
  value: string | File;
  onChange: (value: string | File) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        onChange(file);
      } else {
        alert('Unsupported file type. Please upload a PDF or TXT file.\nWord documents are not supported, please save as a PDF first.');
      }
    }
  };

  const clearFile = () => {
    onChange('');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const isFile = value instanceof File;
  const textValue = isFile ? '' : value;

  return (
    <div>
      <label className="block text-lg font-semibold mb-2 text-slate-300">
        1. Add Job Description
      </label>
      {isFile ? (
        <div className="w-full p-3 bg-slate-900 border border-slate-600 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <DocumentIcon className="text-slate-400 h-8 w-8 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-slate-200 font-medium truncate" title={value.name}>{value.name}</p>
              <p className="text-slate-500 text-sm">{(value.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-1.5 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white transition-colors flex-shrink-0 ml-2"
            aria-label="Remove file"
          >
            <XCircleIcon />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed border-slate-600 rounded-xl p-4 transition-colors duration-200 ${isDragging ? 'bg-slate-700/50 border-purple-500' : 'bg-slate-900/50'}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            accept=".pdf,.txt,application/pdf,text/plain"
          />
          <div className="text-center mb-3">
            <FileUploadIcon className="mx-auto" />
            <p className="mt-2 text-slate-400">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="font-semibold text-purple-400 hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded">
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
            id="job-description"
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter the full job description here..."
            rows={8}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 placeholder-slate-500"
          />
        </div>
      )}
    </div>
  );
};
