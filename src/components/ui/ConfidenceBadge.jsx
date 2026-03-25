import React from 'react';
import { cn } from '../../utils/cn';

/**
 * ConfidenceBadge - AI confidence with plain-language subtitle
 */
const ConfidenceBadge = ({
  confidence,
  size = 'md',
  showPercentage = true,
  showPlainLanguage = true,
  className,
}) => {
  const normalizedConfidence = confidence > 1 ? confidence / 100 : confidence;

  const getLevel = () => {
    if (normalizedConfidence >= 0.8) return 'high';
    if (normalizedConfidence >= 0.6) return 'medium';
    return 'low';
  };

  const level = getLevel();
  const percentage = (normalizedConfidence * 100).toFixed(0);

  const plainByLevel = {
    high: 'Usually works for similar issues.',
    medium: 'Reasonable try — double-check if your situation is unusual.',
    low: 'Uncertain for this case — consider a human or more details.',
  };

  const config = {
    high: {
      label: 'High confidence',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-200 dark:border-green-800/50',
    },
    medium: {
      label: 'Medium confidence',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      textClass: 'text-amber-700 dark:text-amber-400',
      borderClass: 'border-amber-200 dark:border-amber-800/50',
    },
    low: {
      label: 'Low confidence',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      textClass: 'text-red-700 dark:text-red-400',
      borderClass: 'border-red-200 dark:border-red-800/50',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const levelConfig = config[level];

  return (
    <span className="inline-flex flex-col gap-0.5 max-w-full">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-md border',
          levelConfig.bgClass,
          levelConfig.textClass,
          levelConfig.borderClass,
          sizeClasses[size],
          className
        )}
      >
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            level === 'high' && 'bg-green-600 dark:bg-green-400',
            level === 'medium' && 'bg-amber-600 dark:bg-amber-400',
            level === 'low' && 'bg-red-600 dark:bg-red-400'
          )}
        />
        <span>{levelConfig.label}</span>
        {showPercentage && <span className="font-semibold">({percentage}%)</span>}
      </span>
      {showPlainLanguage && (
        <span className="text-[11px] leading-snug text-gray-600 dark:text-gray-400 pl-0.5">
          {plainByLevel[level]}
        </span>
      )}
    </span>
  );
};

export default ConfidenceBadge;
