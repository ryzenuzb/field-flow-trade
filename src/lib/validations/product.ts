import { z } from 'zod';

export const productSchema = z.object({
  title: z
    .string()
    .min(3, 'Nom kamida 3 ta belgidan iborat bo\'lishi kerak')
    .max(200, 'Nom 200 ta belgidan oshmasligi kerak')
    .trim(),
  description: z
    .string()
    .max(2000, 'Tavsif 2000 ta belgidan oshmasligi kerak')
    .optional()
    .nullable(),
  price: z
    .number()
    .positive('Narx musbat son bo\'lishi kerak')
    .max(1000000000, 'Narx juda katta'),
  unit: z.enum(['kg', 'dona', 'litr', 'tonna', 'paket'], {
    errorMap: () => ({ message: 'Noto\'g\'ri birlik' })
  }),
  category: z.enum(['Sabzavot', 'Meva', 'Don', 'Sut', 'Urug', 'Boshqa'], {
    errorMap: () => ({ message: 'Noto\'g\'ri kategoriya' })
  }),
  stock_quantity: z
    .number()
    .int('Miqdor butun son bo\'lishi kerak')
    .min(0, 'Miqdor 0 dan kam bo\'lmasligi kerak')
    .max(1000000, 'Miqdor juda katta'),
  location: z
    .string()
    .max(200, 'Joylashuv 200 ta belgidan oshmasligi kerak')
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url('Noto\'g\'ri URL format')
    .optional()
    .nullable()
});

export const productUpdateSchema = productSchema.partial();

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
