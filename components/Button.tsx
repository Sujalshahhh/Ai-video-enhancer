import React, { useEffect, useState, useRef } from "react";

// Confetti type
type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  ticks?: number;
  origin?: { x?: number; y?: number; };
  colors?: string[];
  shapes?: string[];
  scalar?: number;
  zIndex?: number;
  disableForReducedMotion?: boolean;
};

declare global {
  interface Window {
    confetti?: (options?: ConfettiOptions) => void;
  }
}

// Simple spinner
const Loader2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  withConfetti?: boolean;
  confettiOptions?: ConfettiOptions;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      className = "",
      icon,
      iconPosition = "left",
      loading = false,
      withConfetti = false,
      confettiOptions = {
        particleCount: 100,
        spread: 70,
        colors: ['var(--primary-accent-start)', 'var(--primary-accent-end)', '#FFFFFF'],
      },
      ...props
    },
    ref
  ) => {
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    // Load confetti script
    useEffect(() => {
        if (!withConfetti) return;
        if (window.confetti) {
            setScriptLoaded(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
        };
    }, [withConfetti]);

    const triggerConfetti = () => {
      if (withConfetti && scriptLoaded && window.confetti && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        const processedConfettiOptions = {
            ...confettiOptions,
            colors: confettiOptions.colors?.map(color => {
                if (color.startsWith('var(')) {
                    return getComputedStyle(document.documentElement).getPropertyValue(color.slice(4, -1)).trim();
                }
                return color;
            })
        };
        window.confetti({ ...processedConfettiOptions, origin: { x, y } });
      }
    };

    const sizeClasses = {
        sm: "text-sm px-4 py-2 rounded-lg",
        md: "text-base px-6 py-2.5 rounded-lg",
        lg: "text-lg px-8 py-3 rounded-xl",
        xl: "text-2xl px-10 py-4 rounded-xl",
    };
    
    // Updated variant classes for the new design
    const variantClasses = {
        primary: "btn-gradient text-white font-bold shadow-lg shadow-[var(--primary-accent-start)]/20 hover:shadow-2xl hover:shadow-[var(--primary-accent-start)]/40",
        secondary: "bg-[var(--container-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold hover:bg-white/10 hover:border-white/20 backdrop-blur-sm",
        ghost: "bg-transparent text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
    };
    
    const baseClasses = "relative flex items-center justify-center gap-2.5 transition-all duration-300 transform-gpu hover:scale-[1.03] active:scale-[0.98] disabled:scale-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-color)] focus-visible:ring-[var(--primary-accent-start)]";

    return (
      <>
        {variant === 'primary' && (
            <style
                dangerouslySetInnerHTML={{
                __html: `
                    .btn-gradient {
                        background-image: var(--primary-accent-gradient);
                        background-size: 200% auto;
                        transition: all 0.5s cubic-bezier(.2,.8,.4,1);
                    }
                    .btn-gradient:hover {
                        background-position: 100% 50%;
                    }
                    `,
                }}
            />
        )}
        <button
            ref={(node) => {
                if (typeof ref === "function") ref(node);
                else if (ref) ref.current = node;
                buttonRef.current = node;
            }}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            onClick={(e) => {
                triggerConfetti();
                props.onClick?.(e);
            }}
            disabled={loading || props.disabled}
            {...props}
        >
          <span className={`flex items-center justify-center gap-2.5 ${loading ? 'invisible' : 'visible'}`}>
            {icon && iconPosition === "left" && icon}
            {children}
            {icon && iconPosition === "right" && icon}
          </span>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </button>
      </>
    );
  }
);
Button.displayName = "Button";
export { Button };