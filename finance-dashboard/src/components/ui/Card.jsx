import React from 'react';

export const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  ...props 
}) => {
  const baseClasses = `
    glass rounded-xl border transition-all duration-300 ease-out
    ${hover ? 'hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1' : ''}
    ${className.includes('h-full') ? 'flex flex-col' : ''}
  `;
  
  const variants = {
    default: '',
    compact: '',
    stat: 'text-center',
    elevated: 'shadow-2xl shadow-black/30'
  };
  
  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return (
    <div className={`p-8 pb-0 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children, className = '' }) => {
  const isFlexGrow = className.includes('flex-1') || className.includes('flex-grow');
  return (
    <div className={`p-8 pt-4 ${isFlexGrow ? 'overflow-hidden' : ''} ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-[var(--text-accent)] ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-[var(--text-secondary)] mt-1 ${className}`}>
      {children}
    </p>
  );
};

export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`p-8 pt-4 border-t border-[var(--border-secondary)] ${className}`}>
      {children}
    </div>
  );
};
