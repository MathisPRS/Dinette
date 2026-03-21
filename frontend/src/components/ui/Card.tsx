import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden',
        onClick && 'cursor-pointer active:scale-95 transition-transform',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
