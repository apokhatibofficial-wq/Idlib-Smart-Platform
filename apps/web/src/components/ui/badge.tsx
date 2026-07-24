import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-extrabold',
  {
    variants: {
      variant: {
        neutral: 'bg-gray-100 text-gray-700',
        primary: 'bg-green-100 text-green-700',
        gold: 'bg-transparent text-gold-deep uppercase tracking-wide',
        success: 'bg-[#e7f2e6] text-[#2c5e33]',
        warning: 'bg-[#fff9e8] text-[#6b5a17]',
        danger: 'bg-[#fbe9e8] text-[#8f1d21]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
