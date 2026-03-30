import * as React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = React.useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const maskX = useSpring(mouseX, { stiffness: 250, damping: 25 });
    const maskY = useSpring(mouseY, { stiffness: 250, damping: 25 });

    const buttonX = useTransform(maskX, (value) => (value - 50) * 0.15);
    const buttonY = useTransform(maskY, (value) => (value - 20) * 0.15);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || disabled || isLoading) return;
      const rect = buttonRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    const variantStyles = {
      primary: {
        base: 'bg-primary text-primary-foreground border-primary',
        overlay: 'bg-background text-primary',
      },
      outline: {
        base: 'bg-transparent text-foreground border-border',
        overlay: 'bg-foreground text-background',
      },
      ghost: {
        base: 'bg-transparent text-muted-foreground border-transparent',
        overlay: 'bg-muted text-foreground',
      },
      destructive: {
        base: 'bg-destructive text-destructive-foreground border-destructive',
        overlay: 'bg-background text-destructive',
      },
    };

    const sizeStyles = {
      default: 'h-12 px-8 text-sm',
      sm: 'h-10 px-5 text-xs',
      lg: 'h-16 px-10 text-base',
      icon: 'h-12 w-12 p-0',
    };

    const currentVariant = variantStyles[variant];

    const renderContent = (isOverlay: boolean = false) => {
      const hasText = text && text.length > 0;

      return (
        <motion.span
          className={cn(
            'flex items-center justify-center',
            hasText && (leftIcon || rightIcon || isLoading) ? 'gap-2' : ''
          )}
          animate={{
            letterSpacing: isHovered && hasText ? '0.05em' : '0em',
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}

          {!isLoading && leftIcon && (
            <span className="flex items-center justify-center">{leftIcon}</span>
          )}

          {hasText && <span>{text}</span>}

          {!isLoading && rightIcon && (
            <span className="flex items-center justify-center">{rightIcon}</span>
          )}
        </motion.span>
      );
    };

    return (
      <motion.button
        ref={buttonRef}
        className={cn(
          'relative isolate overflow-hidden rounded-full border font-bold uppercase tracking-widest',
          'inline-flex items-center justify-center',
          'transition-[box-shadow,border-color] duration-300',
          'hover:shadow-[0_0_0_1px_hsl(148_60%_50%/0.5),0_0_12px_3px_hsl(148_60%_45%/0.4),0_0_28px_6px_hsl(148_60%_38%/0.18)]',
          'hover:border-[hsl(148_60%_50%/0.8)]',
          currentVariant.base,
          sizeStyles[size],
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          (disabled || isLoading) && 'cursor-not-allowed opacity-60',
          className
        )}
        style={{ x: buttonX, y: buttonY }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          mouseX.set(0);
          mouseY.set(0);
        }}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.95 }}
        type="button"
        {...(props as any)}
      >
        <svg className="absolute hidden">
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -2"
            />
            <feComposite operator="in" in2="SourceGraphic" result="monoNoise" />
            <feBlend in="SourceGraphic" in2="monoNoise" mode="screen" />
          </filter>
        </svg>

        <span className="relative z-10 pointer-events-none">
          {renderContent()}
        </span>

        <motion.div
          className={cn(
            'absolute inset-0 z-20 flex items-center justify-center',
            'pointer-events-none select-none',
            currentVariant.overlay,
            sizeStyles[size]
          )}
          style={{
            clipPath: useTransform([maskX, maskY], ([x, y]) =>
              isHovered
                ? `circle(100px at ${x}px ${y}px)`
                : `circle(0px at 50% 50%)`
            ),
            WebkitClipPath: useTransform([maskX, maskY], ([x, y]) =>
              isHovered
                ? `circle(100px at ${x}px ${y}px)`
                : `circle(0px at 50% 50%)`
            ),
          }}
          aria-hidden="true"
        >
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
            style={{ filter: 'url(#noiseFilter)' }}
          />
          {renderContent(true)}
        </motion.div>
      </motion.button>
    );
  }
);

EclipseButton.displayName = 'EclipseButton';

export { EclipseButton };
