import React from 'react';
import { cn } from '../../utils/cn';
import Card from './Card';

const tones = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

/**
 * Compact label + value + icon tile, used for dashboard/summary stat rows.
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ReactNode} props.value
 * @param {React.ComponentType} [props.icon]
 * @param {keyof tones} [props.tone]
 * @param {string} [props.className]
 */
const StatCard = React.forwardRef(({ label, value, icon: Icon, tone = 'gray', className, ...rest }, ref) => {
  return (
    <Card ref={ref} className={cn('p-5', className)} {...rest}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 leading-snug">
            {label}
          </p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-2 tabular-nums">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg shrink-0', tones[tone] || tones.gray)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
