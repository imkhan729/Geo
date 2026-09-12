import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EclipseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EclipseButton = React.forwardRef<HTMLButtonElement, EclipseButtonProps>(
  (
    {
      text,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, string> = {
      primary: 'bg-primary text-primary-foreground border-primary',
      outline: 'bg-transparent text-foreground border-border',
      ghost: 'bg-transparent text-muted-foreground border-transparent',
      destructive: 'bg-destructive text-destructive-foreground border-destructive',
    };

    const sizeStyles: Record<string, string> = {
      default: 'h-11 sm:h-12 px-3 sm:px-4 text-xs sm:text-xs md:text-sm font-semibold uppercase tracking-wide',
      sm: 'h-9 sm:h-10 px-3 sm:px-4 text-xs font-semibold tracking-wide',
      lg: 'h-14 sm:h-16 px-6 sm:px-8 text-sm sm:text-base font-bold tracking-wider',
      icon: 'h-11 w-11 sm:h-12 sm:w-12 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-full border font-semibold uppercase tracking-wide',
          'inline-flex items-center justify-center gap-2 max-w-full',
          variantStyles[variant],
          sizeStyles[size],
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          (disabled || isLoading) && 'cursor-not-allowed opacity-60',
          className
        )}
        disabled={disabled || isLoading}
        type="button"
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && (
          <span className="flex items-center justify-center shrink-0">{leftIcon}</span>
        )}
        {text && <span className="min-w-0 text-center leading-tight">{text}</span>}
        {!isLoading && rightIcon && (
          <span className="flex items-center justify-center shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

EclipseButton.displayName = 'EclipseButton';

export { EclipseButton };
