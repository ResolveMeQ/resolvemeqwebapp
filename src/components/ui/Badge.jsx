import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Badge component for status indicators and labels
 * @param {Object} props - Component props
 * @param {string} props.variant - Badge variant (default, primary, secondary, success, warning, error, outline)
 * @param {string} props.size - Badge size (sm, md, lg)
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props
 */
const Badge = React.forwardRef(({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...rest
}, ref) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    default: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    secondary: 'bg-secondary-100 text-secondary-800 border border-secondary-200',
    success: 'bg-success-100 text-success-800 border border-success-200',
    warning: 'bg-warning-100 text-warning-800 border border-warning-200',
    error: 'bg-error-100 text-error-800 border border-error-200',
    outline: 'bg-transparent border border-neutral-300 text-neutral-700',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  const focusRings = {
    default: 'focus:ring-neutral-500',
    primary: 'focus:ring-primary-500',
    secondary: 'focus:ring-secondary-500',
    success: 'focus:ring-success-500',
    warning: 'focus:ring-warning-500',
    error: 'focus:ring-error-500',
    outline: 'focus:ring-neutral-500',
  };
  
  return (
    <span
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        focusRings[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge; 