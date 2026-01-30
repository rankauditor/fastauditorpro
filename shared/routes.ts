import { z } from 'zod';
import { calls } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  calls: {
    upload: {
      method: 'POST' as const,
      path: '/api/upload',
      // input is multipart/form-data, handled separately
      responses: {
        201: z.custom<typeof calls.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/calls',
      responses: {
        200: z.array(z.custom<typeof calls.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/calls/:id',
      responses: {
        200: z.custom<typeof calls.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Optional: explicit analyze trigger if not automatic
    analyze: {
      method: 'POST' as const,
      path: '/api/calls/:id/analyze',
      responses: {
        200: z.custom<typeof calls.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
