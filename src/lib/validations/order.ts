import { z } from 'zod';

export const orderSchema = z.object({
  product_id: z
    .string()
    .uuid('Noto\'g\'ri mahsulot ID'),
  quantity: z
    .number()
    .int('Miqdor butun son bo\'lishi kerak')
    .positive('Miqdor musbat bo\'lishi kerak')
    .max(10000, 'Miqdor juda katta')
});

export const orderStatusSchema = z.object({
  order_id: z
    .string()
    .uuid('Noto\'g\'ri buyurtma ID'),
  status: z.enum([
    'pending',
    'accepted',
    'processing',
    'shipped',
    'delivered',
    'disputed',
    'refunded',
    'cancelled'
  ], {
    errorMap: () => ({ message: 'Noto\'g\'ri status' })
  }),
  reason: z
    .string()
    .max(500, 'Sabab 500 ta belgidan oshmasligi kerak')
    .optional()
});

export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusSchema>;

// Valid status transitions
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'disputed'],
  delivered: ['disputed'],
  disputed: ['refunded', 'delivered'],
  refunded: [],
  cancelled: []
};

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
