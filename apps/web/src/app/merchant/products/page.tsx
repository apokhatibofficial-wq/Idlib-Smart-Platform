'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import { formatSyp } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types/api';

interface ProductInput {
  name: string;
  price: string;
  description: string;
}

function CreateProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const form = useForm<ProductInput>({ defaultValues: { name: '', price: '', description: '' } });

  const mutation = useMutation({
    mutationFn: (values: ProductInput) => api.post<Product>('/merchant/products', values),
    onSuccess: () => {
      toast.success('تمت إضافة المنتج');
      void queryClient.invalidateQueries({ queryKey: ['merchant', 'products'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'تعذّر إضافة المنتج'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>منتج جديد</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-3.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المنتج</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السعر</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending} className="h-auto rounded-[10px] py-3 text-sm font-extrabold">
              {mutation.isPending ? 'جارٍ الإضافة...' : 'إضافة'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MerchantProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: products, isLoading } = useQuery({
    queryKey: ['merchant', 'products'],
    queryFn: () => api.get<Product[]>('/merchant/products'),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">المنتجات</h1>
        <Button onClick={() => setDialogOpen(true)} className="h-auto rounded-[10px] px-4.5 py-2.5 text-sm font-extrabold">
          + منتج جديد
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-[14px]" />)}
        {products?.length === 0 && (
          <p className="col-span-3 rounded-[14px] bg-white py-10 text-center text-sm text-gray-500">
            لا توجد منتجات مضافة بعد
          </p>
        )}
        {products?.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-[14px] bg-white">
            <div className="flex h-22.5 items-center justify-center bg-gray-100 text-[11px] font-semibold text-gray-500">
              صورة المنتج
            </div>
            <div className="p-3">
              <div className="text-[13.5px] font-bold">{product.name}</div>
              <div className="mt-1 text-[12.5px] font-extrabold text-green-700">{formatSyp(product.price)}</div>
            </div>
          </div>
        ))}
      </div>

      <CreateProductDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
