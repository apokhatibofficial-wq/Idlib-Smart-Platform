'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { UploadedFile } from '@/types/api';

interface UploadSlotProps {
  kind: 'image' | 'video';
  label: string;
  className?: string;
  onUploaded: (file: UploadedFile | null) => void;
}

export function UploadSlot({ kind, label, className, onUploaded }: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return api.upload<UploadedFile>(`/uploads?kind=${kind}`, form);
    },
    onSuccess: (uploaded, file) => {
      setFileName(file.name);
      onUploaded(uploaded);
    },
    onError: (error: unknown) => {
      setFileName(null);
      onUploaded(null);
      window.alert(error instanceof ApiError ? error.message : 'تعذّر رفع الملف');
    },
  });

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex h-22 flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-gray-300 px-2 text-center text-xs font-semibold text-gray-500 transition-colors',
        fileName && 'border-green-700 text-green-700',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm,video/quicktime'}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) mutation.mutate(file);
          e.target.value = '';
        }}
      />
      {mutation.isPending ? 'جارٍ الرفع...' : fileName ? 'تم الإرفاق بنجاح' : label}
    </button>
  );
}
