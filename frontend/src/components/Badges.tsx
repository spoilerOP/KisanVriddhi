import React from 'react';
import { Sparkles, CheckCircle, CloudSun, Shield, Cpu } from 'lucide-react';

interface BadgeProps {
  type: 'ai' | 'expert' | 'weather' | 'gov' | 'google';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  const iconSize = size === 'sm' ? 12 : 14;

  switch (type) {
    case 'ai':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm ${sizeClasses}`}>
          <Sparkles size={iconSize} className="animate-pulse" />
          AI Powered
        </span>
      );
    case 'expert':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shadow-sm ${sizeClasses}`}>
          <CheckCircle size={iconSize} />
          Expert Verified
        </span>
      );
    case 'weather':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shadow-sm ${sizeClasses}`}>
          <CloudSun size={iconSize} />
          Weather Aware
        </span>
      );
    case 'gov':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 shadow-sm ${sizeClasses}`}>
          <Shield size={iconSize} />
          Government Ready
        </span>
      );
    case 'google':
      return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 text-transparent bg-clip-text border border-gray-250 dark:border-zinc-800 shadow-sm ${sizeClasses} relative overflow-hidden group`}>
          <span className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-blue-500/5 to-yellow-500/5 opacity-50"></span>
          <Cpu size={iconSize} className="text-blue-500 mr-0.5 animate-spin-slow inline" style={{ animationDuration: '8s' }} />
          <span className="font-extrabold text-gray-800 dark:text-zinc-200">Google AI Enabled</span>
        </span>
      );
    default:
      return null;
  }
};

export const BadgesGroup: React.FC<{ badges: ('ai' | 'expert' | 'weather' | 'gov' | 'google')[] }> = ({ badges }) => {
  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge, idx) => (
        <Badge key={idx} type={badge} />
      ))}
    </div>
  );
};
