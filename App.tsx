
import React, { useState, useCallback } from 'react';
import { ToastMessage } from './types';
import { LogoIcon } from './components/icons/LogoIcon';
import ToastNotifications from './components/ToastNotifications';
import VideoEnhancer from './components/VideoEnhancer';
import ImageEnhancer from './components/ImageEnhancer';
import AppSwitcher from './components/AppSwitcher';

const App: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [activeApp, setActiveApp] = useState<'video' | 'image'>('image');

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
        const id = Date.now() + Math.random();
        setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    }, []);

    return (
        <div className="min-h-screen text-white flex flex-col items-center relative isolate">
            <ToastNotifications toasts={toasts} onDismiss={removeToast} />
            
            <header className="sticky top-0 left-0 right-0 z-30 w-full bg-[#121212]/50 backdrop-blur-lg border-b border-[var(--border-color)] animate-enter">
                <div className="mx-auto max-w-7xl px-4 sm:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-glow">
                            Pixel Booster Pro
                        </h1>
                    </div>
                </div>
            </header>

            <div className="w-full flex-1 flex flex-col items-center p-4 sm:p-8 md:p-12">
                <div className="mb-12">
                    <AppSwitcher activeApp={activeApp} setActiveApp={setActiveApp} />
                </div>
                <main className="w-full flex flex-col items-center justify-center flex-1">
                    {activeApp === 'video' && <VideoEnhancer addToast={addToast} />}
                    {activeApp === 'image' && <ImageEnhancer addToast={addToast} />}
                </main>
            </div>

            <footer className="py-8 mt-16 w-full border-t border-[var(--border-color)] bg-[#121212]/50">
                <div className="container mx-auto px-4 sm:px-8 text-center text-[var(--text-secondary)]">
                    <p>&copy; 2025 Pixel Booster Pro. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;
