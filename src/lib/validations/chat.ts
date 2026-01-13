import { z } from 'zod';

export const messageSchema = z.object({
  room_id: z
    .string()
    .uuid('Noto\'g\'ri xona ID'),
  content: z
    .string()
    .min(1, 'Xabar bo\'sh bo\'lmasligi kerak')
    .max(5000, 'Xabar 5000 ta belgidan oshmasligi kerak')
    .trim(),
  content_type: z
    .enum(['text', 'image', 'file', 'system'])
    .optional()
    .default('text'),
  attachment_url: z
    .string()
    .url('Noto\'g\'ri URL format')
    .optional()
    .nullable()
});

export const createChatSchema = z.object({
  other_user_id: z
    .string()
    .uuid('Noto\'g\'ri foydalanuvchi ID')
});

export const orderChatSchema = z.object({
  order_id: z
    .string()
    .uuid('Noto\'g\'ri buyurtma ID')
});

export type MessageFormData = z.infer<typeof messageSchema>;
export type CreateChatData = z.infer<typeof createChatSchema>;
export type OrderChatData = z.infer<typeof orderChatSchema>;
