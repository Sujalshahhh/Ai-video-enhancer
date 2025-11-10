
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { Button } from './Button';

interface VideoResultProps {
  originalUrl: string;
  enhancedUrl:string;
  fileName: string;
  onRestart: () => void;
  filterStyle: React.CSSProperties;
  originalDimensions: { width: number, height: number } | null;
}

const VideoResult: React.FC<VideoResultProps> = ({ originalUrl, enhancedUrl, fileName, onRestart, filterStyle, originalDimensions }) => {

  const handleDownload = () => {
      if (!enhancedUrl) return;
      const link = document.createElement('a');
      link.href = enhancedUrl;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      // Provide a single, high-quality download option
      link.download = `${baseName}_enhanced.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const aspectRatio = originalDimensions ? `${originalDimensions.width} / ${originalDimensions.height}` : '16 / 9';

  return (
    <div className="w-full max-w-7xl mx-auto h-full flex flex-col animate-enter">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-glow">Enhancement Complete</h2>
        <p className="mt-2 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">Your full enhanced video is ready. Download it or start over.</p>
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 w-full p-4 animate-enter">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider text-center">Original</h3>
            <div className="p-[3px] rounded-xl border border-[var(--border-color)]">
              <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                <video src={originalUrl} controls className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gradient mb-3 uppercase tracking-wider text-center">Enhanced Video</h3>
            <div className="p-1 rounded-xl relative shadow-2xl shadow-[var(--primary-accent-start)]/30" style={{background: 'var(--primary-accent-gradient)'}}>
                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio }}>
                    <video 
                        src={enhancedUrl} 
                        controls 
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
        <Button
          onClick={handleDownload}
          size="lg"
          className="w-full sm:w-auto uppercase tracking-wider text-sm sm:text-base"
          variant="primary"
          withConfetti
          icon={<DownloadIcon className="w-6 h-6" />}
        >
          Download Video
        </Button>
        <Button
            onClick={onRestart}
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base"
            icon={<RefreshIcon className="w-5 h-5" />}
        >
            Enhance Another Video
        </Button>
      </div>
    </div>
  );
};

export default VideoResult;
