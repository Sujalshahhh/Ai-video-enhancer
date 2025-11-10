import React from 'react';

interface ProgressBarProps {
  progress: number;
  message: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message }) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-16 animate-enter">
      <style>
        {`
          @keyframes shimmer-animation {
            0% {
              transform: translateX(-100%) skewX(-20deg);
            }
            100% {
              transform: translateX(250%) skewX(-20deg);
            }
          }
          .progress-bar-fill {
            background-color: var(--primary-accent-start);
            position: relative;
            overflow: hidden;
            box-shadow: 0 0 8px rgba(75, 196, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15);
          }
          .progress-bar-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 40%;
            height: 100%;
            background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
            animation: shimmer-animation 1.5s ease-in-out infinite;
          }
        `}
      </style>
      <p className="text-xl text-[var(--text-secondary)] mb-6 text-center tracking-wider">{message}</p>
      <div className="w-full bg-white/5 h-3 rounded-full shadow-inner overflow-hidden border border-[var(--border-color)]">
        <div
          className="progress-bar-fill h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
