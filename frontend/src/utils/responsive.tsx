import React from 'react';

/**
 * Hook for responsive breakpoints
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const px = breakpoints[breakpoint];
  return useMediaQuery(`(min-width: ${px}px)`);
}

export function useResponsive() {
  const isXs = useMediaQuery('(max-width: 639px)');
  const isSm = useBreakpoint('sm');
  const isMd = useBreakpoint('md');
  const isLg = useBreakpoint('lg');
  const isXl = useBreakpoint('xl');
  const is2xl = useBreakpoint('2xl');

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile: isXs,
    isTablet: isSm && !isMd,
    isDesktop: isMd,
  };
}

/**
 * Accessibility utility: ARIA live regions
 */
export function useLiveRegion(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const regionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (message && regionRef.current) {
      regionRef.current.setAttribute('aria-live', priority);
      regionRef.current.textContent = message;
    }
  }, [message, priority]);

  return regionRef;
}

/**
 * Accessibility utility: Skip navigation
 */
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-0 left-0 z-50 px-4 py-2 bg-blue-600 text-white"
    >
      Skip to main content
    </a>
  );
}

/**
 * Accessibility utility: Keyboard navigation
 */
export function useKeyboardShortcut(key: string, callback: () => void, ctrlKey = false) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const modifierMatch = ctrlKey ? e.ctrlKey || e.metaKey : true;
      if (e.key === key && modifierMatch) {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrlKey]);
}

/**
 * Accessibility utility: Focus management
 */
export function useFocusManager() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const focusFirstElement = React.useCallback(() => {
    const focusableElement = containerRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    focusableElement?.focus();
  }, []);

  const focusLastElement = React.useCallback(() => {
    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }, []);

  const trapFocus = React.useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    const activeElement = document.activeElement;

    if (e.shiftKey && activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    trapFocus,
  };
}

/**
 * Responsive mobile menu component
 */
interface ResponsiveMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ResponsiveMenu({ isOpen, onClose, children }: ResponsiveMenuProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          role="presentation"
        />
      )}

      {/* Mobile menu */}
      <div
        className={`fixed top-0 right-0 h-screen w-64 bg-white shadow-lg transform transition z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {children}
      </div>
    </>
  );
}

/**
 * CSS-in-JS responsive styles helper
 */
export const responsiveClasses = {
  // Flexbox responsive
  flexCol: 'flex flex-col md:flex-row',
  gridAuto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // Padding responsive
  paddingResponsive: 'px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8',

  // Font responsive
  fontResponsive: 'text-sm md:text-base lg:text-lg',

  // Gap responsive
  gapResponsive: 'gap-2 md:gap-4 lg:gap-6',
};

/**
 * Accessible button component with keyboard support
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  ariaLabel?: string;
  children: React.ReactNode;
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ariaLabel,
  className,
  disabled,
  children,
  ...props
}: AccessibleButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className || ''}
      `}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="inline-block mr-2 animate-spin">⟳</span>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Accessible modal component
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function AccessibleModal({ isOpen, onClose, title, children }: AccessibleModalProps) {
  const { trapFocus } = useFocusManager();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          trapFocus(e as any);
        }}
      >
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
