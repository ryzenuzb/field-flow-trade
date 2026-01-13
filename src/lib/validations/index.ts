// Centralized validation exports
export * from './product';
export * from './order';
export * from './chat';
export * from './review';
export * from './farm';

// Common validation utilities
import { z } from 'zod';

export const uuidSchema = z.string().uuid('Noto\'g\'ri ID format');

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
});

export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['created_at', 'price', 'rating', 'title']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
