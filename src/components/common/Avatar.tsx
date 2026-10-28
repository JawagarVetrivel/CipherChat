import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away';
  className?: string;
  variant?: 'emerald' | 'slate' | 'neutral';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  status,
  className = '',
  variant = 'emerald',
}) => {
  const getInitials = (n: string) => {
    if (!n) return '??';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px] rounded-lg',
    md: 'w-9 h-9 text-xs font-semibold rounded-lg',
    lg: 'w-11 h-11 text-sm font-semibold rounded-xl',
    xl: 'w-14 h-14 text-base font-bold rounded-xl',
  };

  const statusSizeClasses = {
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-1.5',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  const statusColorClasses = {
    online: 'bg-[#00E599] shadow-[0_0_6px_#00E599]',
    offline: 'bg-neutral-500',
    away: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
  };

  // Color scheme variants based on name initials or explicit variant
  const initials = getInitials(name);
  const isEmerald = variant === 'emerald' || initials === 'PK' || initials === 'RS';

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} object-cover border border-[#1E2638]`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${
            isEmerald
              ? 'bg-[#0B281E] text-[#00E599] border border-[#00E599]/30'
              : 'bg-[#141B28] text-slate-200 border border-[#212D42]'
          } flex items-center justify-center font-mono select-none transition-all`}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={`absolute -top-0.5 -right-0.5 block rounded-full ring-[#0A0D12] ${statusSizeClasses[size]} ${statusColorClasses[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
