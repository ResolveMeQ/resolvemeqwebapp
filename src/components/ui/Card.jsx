import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Card component with glassmorphism effects and multiple variants
 * @param {Object} props - Component props
 * @param {string} props.variant - Card variant (default, glass, elevated, interactive)
 * @param {boolean} props.hover - Whether to show hover effects
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional props
 */
const Card = React.forwardRef(({
  variant = 'default',
  hover = true,
  children,
  className,
  ...rest
}, ref) => {
  const baseClasses = 'rounded-lg transition-all duration-300';
  
  const variants = {
    default: 'bg-white border border-neutral-200 shadow-sm',
    glass: 'glass-card',
    elevated: 'bg-white border border-neutral-200 shadow-lg hover:shadow-xl',
    interactive: 'bg-white border border-neutral-200 shadow-sm hover:shadow-lg hover:scale-[1.02] cursor-pointer',
  };
  
  const hoverClasses = hover ? 'hover:shadow-lg hover:scale-[1.02]' : '';
  
  return (
    <div
      ref={ref}
      className={cn(
        baseClasses,
        variants[variant],
        hoverClasses,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Card Header component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Header content
 * @param {string} props.className - Additional CSS classes
 */
const CardHeader = React.forwardRef(({ children, className, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 pb-0', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Card Title component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Title content
 * @param {string} props.className - Additional CSS classes
 */
const CardTitle = React.forwardRef(({ children, className, ...rest }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight text-neutral-900', className)}
      {...rest}
    >
      {children}
    </h3>
  );
});

/**
 * Card Description component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Description content
 * @param {string} props.className - Additional CSS classes
 */
const CardDescription = React.forwardRef(({ children, className, ...rest }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-neutral-600', className)}
      {...rest}
    >
      {children}
    </p>
  );
});

/**
 * Card Content component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content
 * @param {string} props.className - Additional CSS classes
 */
const CardContent = React.forwardRef(({ children, className, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

/**
 * Card Footer component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} props.className - Additional CSS classes
 */
const CardFooter = React.forwardRef(({ children, className, ...rest }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardDescription.displayName = 'CardDescription';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export default Card; 