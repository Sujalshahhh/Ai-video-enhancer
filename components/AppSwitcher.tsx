
import React from 'react';

interface AppSwitcherProps {
  activeApp: 'video' | 'image';
  setActiveApp: (app: 'video' | 'image') => void;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ activeApp, setActiveApp }) => {
  const buttonStyle = "px-6 py-2 text-base font-semibold rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] focus-visible:ring-[var(--primary-accent-start)] relative";
  const activeStyle = "text-black shadow-lg shadow-[var(--primary-accent-start)]/20";
  const inactiveStyle = "bg-transparent text-[var(--text-secondary)] hover:bg-white/10 hover:text-white";

  return (
    <div className="bg-[var(--container-bg)] p-1.5 rounded-xl flex items-center gap-2 border border-[var(--border-color)] animate-enter" style={{animationDelay: '100ms'}}>
      <button 
        onClick={() => setActiveApp('image')}
        className={`${buttonStyle} ${activeApp === 'image' ? activeStyle : inactiveStyle}`}
        aria-pressed={activeApp === 'image'}
      >
        {activeApp === 'image' && <div className="absolute inset-0 rounded-lg" style={{background: 'var(--primary-accent-gradient)'}}></div>}
        <span className="relative z-10">Image Enhancer</span>
      </button>
      <button 
        onClick={() => setActiveApp('video')}
        className={`${buttonStyle} ${activeApp === 'video' ? activeStyle : inactiveStyle}`}
        aria-pressed={activeApp === 'video'}
      >
        {activeApp === 'video' && <div className="absolute inset-0 rounded-lg" style={{background: 'var(--primary-accent-gradient)'}}></div>}
        <span className="relative z-10">Video Enhancer</span>
      </button>
    </div>
  );
};

export default AppSwitcher;