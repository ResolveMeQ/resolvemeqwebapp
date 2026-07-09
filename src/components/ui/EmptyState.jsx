import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Centered icon + title + description block for empty lists/search results.
 * @param {Object} props
 * @param {React.ComponentType} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]
 * @param {string} [props.className]
 */
const EmptyState = React.forwardRef(({ icon: Icon, title, description, action, className, ...rest }, ref) => {
  return (
    <div ref={ref} className={cn('py-12 text-center', className)} {...rest}>
      {Icon && <Icon className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />}
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
