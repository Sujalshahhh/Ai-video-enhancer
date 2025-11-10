import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';

// Icons as components
const ErrorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--primary-accent-start)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SuccessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface ToastProps {
    toast: ToastMessage;
    onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onDismiss]);
    
    const icons = {
        error: <ErrorIcon />,
        info: <InfoIcon />,
        success: <SuccessIcon />,
    };

    return (
        <div 
            role="alert"
            className="bg-gray-800/80 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/30 rounded-lg p-4 flex items-start gap-4 animate-fade-in w-full"
        >
            <div className="flex-shrink-0 pt-0.5">{icons[toast.type]}</div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-[var(--text-primary)]">{toast.message}</p>
            </div>
             <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};


interface ToastNotificationsProps {
    toasts: ToastMessage[];
    onDismiss: (id: number) => void;
}

const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toasts, onDismiss }) => {
    return (
        <div aria-live="assertive" className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

export default ToastNotifications;