import { z } from 'zod';

export const farmProfileSchema = z.object({
  farm_name: z
    .string()
    .min(2, 'Ferma nomi kamida 2 ta belgidan iborat bo\'lishi kerak')
    .max(100, 'Ferma nomi 100 ta belgidan oshmasligi kerak')
    .trim(),
  farm_size: z
    .number()
    .positive('Maydon musbat son bo\'lishi kerak')
    .max(100000, 'Maydon juda katta')
    .optional()
    .nullable(),
  farm_type: z
    .array(z.enum(['sabzavot', 'meva', 'don', 'sut', 'parrandachilik', 'chorvachilik', 'boshqa']))
    .min(1, 'Kamida bitta tur tanlang')
    .optional(),
  soil_type: z
    .enum(['qumli', 'loyqa', 'tuproq', 'qora tuproq', 'boshqa'])
    .optional()
    .nullable(),
  irrigation_type: z
    .enum(['tomchilatib', 'yomg\'irlatib', 'ariq', 'quduq', 'boshqa'])
    .optional()
    .nullable(),
  region: z
    .string()
    .max(100, 'Viloyat nomi juda uzun')
    .optional()
    .nullable(),
  district: z
    .string()
    .max(100, 'Tuman nomi juda uzun')
    .optional()
    .nullable()
});

export type FarmProfileFormData = z.infer<typeof farmProfileSchema>;

// Uzbekistan regions
export const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg\'ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Qoraqalpog\'iston Respublikasi',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati'
];
