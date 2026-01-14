
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean; // Kept for API compatibility
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Logo component refined to show only the brand typography with enhanced spacing.
 */
const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md'
}) => {
  const sizes = {
    sm: { main: 'text-xl', sub: 'text-[7px]', gap: 'gap-1' },
    md: { main: 'text-2xl', sub: 'text-[9px]', gap: 'gap-2' },
    lg: { main: 'text-4xl', sub: 'text-[13px]', gap: 'gap-3' },
    xl: { main: 'text-5xl', sub: 'text-[16px]', gap: 'gap-4' }
  };

  const current = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`flex flex-col items-center ${current.gap}`}>
        <span className={`text-[#1B2B65] font-black uppercase tracking-tight ${current.main} leading-none font-sans`}>
          VendLink
        </span>
        <span className={`text-[#757575] uppercase tracking-[0.5em] font-bold ${current.sub} leading-none font-sans`}>
          NETWORKS
        </span>
      </div>
    </div>
  );
};

export default Logo;
