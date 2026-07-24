import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full resize-none rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-gray-500',
        'focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
