import React from 'react';

interface AmbleLogoProps {
  className?: string;
  size?: number;
}

export const AmbleLogo: React.FC<AmbleLogoProps> = ({ className = '', size = 40 }) => {
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
        <linearGradient id="ambleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
      
      {/* Mountain path design */}
      <path
        d="M 20 80 L 35 50 L 50 65 L 65 30 L 80 60 L 80 80 Z"
        fill="url(#ambleGradient)"
        opacity="0.8"
      />
      <path
        d="M 20 80 L 35 50 L 50 65 L 65 30 L 80 60"
        stroke="url(#ambleGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Circle accents */}
      <circle cx="35" cy="50" r="4" fill="hsl(var(--accent))" />
      <circle cx="50" cy="65" r="4" fill="hsl(var(--accent))" />
      <circle cx="65" cy="30" r="5" fill="hsl(var(--primary))" />
    </svg>
  );
};

export default AmbleLogo;
