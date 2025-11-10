import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="logo_gradient_pbp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--primary-accent-start)" />
                <stop offset="100%" stopColor="var(--primary-accent-end)" />
            </linearGradient>
        </defs>
        <path d="M18 4H30V10H18V4Z" fill="url(#logo_gradient_pbp)" />
        <path d="M18 10L24 16L30 10H18Z" fill="url(#logo_gradient_pbp)" />
        <path d="M6 20H18V32H6V20Z" fill="url(#logo_gradient_pbp)" fillOpacity="0.7"/>
        <path d="M30 20H42V32H30V20Z" fill="url(#logo_gradient_pbp)" fillOpacity="0.7"/>
        <path d="M18 32H30V44H18V32Z" fill="url(#logo_gradient_pbp)" fillOpacity="0.7"/>
    </svg>
);