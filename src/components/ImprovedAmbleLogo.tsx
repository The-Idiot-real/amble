import React from 'react';

interface ImprovedAmbleLogoProps {
  className?: string;
  size?: number;
}

export const ImprovedAmbleLogo: React.FC<ImprovedAmbleLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="ambleMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="ambleAccentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
        </filter>
      </defs>
      
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill="url(#ambleMainGradient)" opacity="0.1" />
      
      {/* Mountain/File path design */}
      <path
        d="M 20 75 L 30 50 L 40 60 L 50 35 L 60 55 L 70 40 L 80 65 V 75 Z"
        fill="url(#ambleMainGradient)"
        opacity="0.6"
      />
      <path
        d="M 20 75 L 30 50 L 40 60 L 50 35 L 60 55 L 70 40 L 80 65"
        stroke="url(#ambleMainGradient)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#shadow)"
      />
      
      {/* File/Document Icon Elements */}
      <rect x="35" y="20" width="30" height="35" rx="3" fill="url(#ambleAccentGradient)" opacity="0.8" />
      <line x1="40" y1="28" x2="60" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="35" x2="60" y2="35" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="42" x2="55" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      
      {/* Accent Dots */}
      <circle cx="30" cy="50" r="3" fill="#f59e0b" filter="url(#shadow)" />
      <circle cx="50" cy="35" r="4" fill="#ea580c" filter="url(#shadow)" />
      <circle cx="70" cy="40" r="3" fill="#fbbf24" filter="url(#shadow)" />
    </svg>
  );
};

export default ImprovedAmbleLogo;
