import React from 'react';

/**
 * Spinner component for loading states
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
}

export function Spinner({ size = 'md', color = 'currentColor', fullScreen = false }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  const spinner = (
    <svg
      className={`${sizeClass} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Loading overlay for async operations
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({ isLoading, message }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        {message && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Skeleton screen component for content placeholders
 */
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', circle = false, className = '' }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : '0.375rem',
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${className}`}
      style={style}
      role="status"
      aria-label="Loading..."
    />
  );
}

/**
 * Skeleton loader for table rows
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} width={`${100 / columns}%`} height="2rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for card
 */
export function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="95%" />
      <Skeleton height="2rem" width="30%" />
    </div>
  );
}

/**
 * Empty state component
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-4xl text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error state component
 */
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Error', message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-red-700 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Toast notification component
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  autoClose?: number; // ms
}

export function Toast({ type, message, onClose, autoClose = 5000 }: ToastProps) {
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const bgColor = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 border rounded-lg p-4 ${bgColor} max-w-sm`} role="alert">
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button
          onClick={onClose}
          className="font-bold hover:opacity-75"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Toast manager hook
 */
export function useToast() {
  const [toasts, setToasts] = React.useState<Array<{ id: string; type: ToastType; message: string }>>([]);

  const showToast = React.useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = React.useCallback((message: string) => showToast('success', message), [showToast]);
  const error = React.useCallback((message: string) => showToast('error', message), [showToast]);
  const warning = React.useCallback((message: string) => showToast('warning', message), [showToast]);
  const info = React.useCallback((message: string) => showToast('info', message), [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
