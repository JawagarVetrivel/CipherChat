import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantClasses = {
    neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
    accent: 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40',
    outline: 'border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-tight rounded',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  return (
    <span className={`inline-flex items-center whitespace-nowrap select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};
