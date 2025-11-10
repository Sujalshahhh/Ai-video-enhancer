import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  title?: string;
  description?: string;
  headline: string;
  subheadline: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = "video/*", 
  title, 
  description = "MP4, MOV, AVI, WMV up to 500MB",
  headline,
  subheadline,
}) => {
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-4xl text-center flex flex-col items-center animate-enter">
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-center text-glow">
        {headline}
      </h2>
      <p className="mt-2 mb-12 text-center text-base sm:text-lg text-[var(--text-secondary)] max-w-3xl mx-auto" style={{animationDelay: '100ms'}}>
          {subheadline}
      </p>
      
      {title && <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-5 uppercase tracking-wider">{title}</h3>}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative w-full p-8 sm:p-16 bg-[var(--container-bg)] backdrop-blur-sm transition-all duration-300 border-2 border-solid rounded-xl ${isDragging ? 'border-[var(--primary-accent-start)] scale-105 shadow-2xl shadow-[var(--primary-accent-start)]/30' : 'border-[var(--border-color)]'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept={accept}
          onChange={handleFileChange}
          aria-label="Upload file"
        />
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
          <UploadIcon className="w-16 h-16 text-[var(--text-secondary)]" />
          <p className="text-base sm:text-lg font-medium text-[var(--text-primary)]">
             <span>Drag &amp; drop a file or </span>
             <label htmlFor="file-upload" className="file-upload-button cursor-pointer pointer-events-auto">
                click to upload
             </label>
          </p>
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;