import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs font-medium',
    lg: 'w-11 h-11 text-sm font-medium',
    xl: 'w-16 h-16 text-lg font-medium',
  };

  const statusSizeClasses = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
  };

  const statusColorClasses = {
    online: 'bg-emerald-500',
    offline: 'bg-neutral-400',
    away: 'bg-amber-500',
  };

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-neutral-200 dark:border-neutral-800`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex items-center justify-center font-mono border border-neutral-300/60 dark:border-neutral-700/60 select-none`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-white dark:ring-neutral-900 ${statusSizeClasses[size]} ${statusColorClasses[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
