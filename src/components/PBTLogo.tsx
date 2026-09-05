import React from 'react';

interface PBTLogoProps {
  className?: string;
  color?: string;
}

export function PBTLogo({ className = "h-6 w-auto", color = "currentColor" }: PBTLogoProps) {
  return (
    <svg
      viewBox="0 0 120 38"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PBT Logo"
    >
      <text
        x="2"
        y="30"
        fill={color}
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fontSize="34"
        fontWeight="900"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        letterSpacing="1.5"
      >
        PBT
      </text>
    </svg>
  );
}

export default PBTLogo;
