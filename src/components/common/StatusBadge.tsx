import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away';
  showLabel?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showLabel = true,
  className = '',
}) => {
  const config = {
    online: {
      color: 'bg-emerald-500',
      text: 'Online',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
    offline: {
      color: 'bg-neutral-400',
      text: 'Offline',
      textColor: 'text-neutral-500 dark:text-neutral-400',
    },
    away: {
      color: 'bg-amber-500',
      text: 'Away',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
  };

  const { color, text, textColor } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {showLabel && <span className={`text-xs font-medium ${textColor}`}>{text}</span>}
    </div>
  );
};
