import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors selection:bg-primary selection:text-primary-foreground placeholder:text-gray-500',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:me-3 file:h-full file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
