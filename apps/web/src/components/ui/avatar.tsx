'use client';

import * as React from 'react';
import { Avatar as AvatarPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva('inline-flex shrink-0 items-center justify-center rounded-full bg-green-900 font-bold text-white select-none', {
  variants: {
    size: {
      sm: 'size-9 text-xs',
      md: 'size-11 text-sm',
      lg: 'size-20 text-2xl',
    },
  },
  defaultVariants: { size: 'md' },
});

/**
 * Per the design brief: identity is always an initials monogram — no photo
 * upload, no decorative icon. This component intentionally has no image slot.
 */
function Avatar({
  className,
  size,
  initial,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & VariantProps<typeof avatarVariants> & { initial: string }) {
  return (
    <AvatarPrimitive.Root data-slot="avatar" className={cn(avatarVariants({ size }), className)} {...props}>
      <span aria-hidden>{initial}</span>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
