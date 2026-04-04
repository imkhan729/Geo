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
      default: 'h-12 px-8 text-sm',
      sm: 'h-10 px-5 text-xs',
      lg: 'h-16 px-10 text-base',
      icon: 'h-12 w-12 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative rounded-full border font-bold uppercase tracking-widest',
          'inline-flex items-center justify-center gap-2',
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
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && (
          <span className="flex items-center justify-center">{leftIcon}</span>
        )}
        {text && <span>{text}</span>}
        {!isLoading && rightIcon && (
          <span className="flex items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

EclipseButton.displayName = 'EclipseButton';

export { EclipseButton };
