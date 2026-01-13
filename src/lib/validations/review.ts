import { z } from 'zod';

export const reviewSchema = z.object({
  order_id: z
    .string()
    .uuid('Noto\'g\'ri buyurtma ID'),
  rating: z
    .number()
    .int('Reyting butun son bo\'lishi kerak')
    .min(1, 'Reyting kamida 1 bo\'lishi kerak')
    .max(5, 'Reyting 5 dan oshmasligi kerak'),
  comment: z
    .string()
    .max(1000, 'Izoh 1000 ta belgidan oshmasligi kerak')
    .optional()
    .nullable()
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
