import { z } from 'zod';
import { insertProfileSchema, insertCollaborationSchema, insertLikeSchema, insertMessageSchema, insertBlockSchema, insertReportSchema, profiles, collaborations, users, likes, matches, messages, blocks, reports } from './schema';

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
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/profiles',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect & { user: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    discover: {
      method: 'GET' as const,
      path: '/api/profiles/discover',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
  },
  likes: {
    create: {
      method: 'POST' as const,
      path: '/api/likes',
      input: insertLikeSchema.extend({ likedId: z.string() }),
      responses: {
        201: z.custom<typeof likes.$inferSelect>(),
        200: z.object({ match: z.custom<typeof matches.$inferSelect>() }),
        400: errorSchemas.validation,
      },
    },
    received: {
      method: 'GET' as const,
      path: '/api/likes/received',
      responses: {
        200: z.array(z.custom<typeof likes.$inferSelect & { liker: typeof users.$inferSelect }>()),
      },
    },
    pass: {
      method: 'POST' as const,
      path: '/api/likes/pass',
      input: z.object({ passedId: z.string() }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  matches: {
    list: {
      method: 'GET' as const,
      path: '/api/matches',
      responses: {
        200: z.array(z.custom<typeof matches.$inferSelect & { user1: typeof users.$inferSelect, user2: typeof users.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/matches/:id',
      responses: {
        200: z.custom<typeof matches.$inferSelect & { user1: typeof users.$inferSelect, user2: typeof users.$inferSelect, messages: (typeof messages.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    unmatch: {
      method: 'DELETE' as const,
      path: '/api/matches/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    send: {
      method: 'POST' as const,
      path: '/api/matches/:matchId/messages',
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/matches/:matchId/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
    markRead: {
      method: 'PATCH' as const,
      path: '/api/matches/:matchId/messages/read',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  blocks: {
    create: {
      method: 'POST' as const,
      path: '/api/blocks',
      input: insertBlockSchema.extend({ blockedId: z.string() }),
      responses: {
        201: z.custom<typeof blocks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/blocks',
      responses: {
        200: z.array(z.custom<typeof blocks.$inferSelect & { blocked: typeof users.$inferSelect }>()),
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/blocks/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
  },
  reports: {
    create: {
      method: 'POST' as const,
      path: '/api/reports',
      input: insertReportSchema.extend({ reportedId: z.string() }),
      responses: {
        201: z.custom<typeof reports.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  collaborations: {
    list: {
      method: 'GET' as const,
      path: '/api/collaborations',
      responses: {
        200: z.array(z.custom<typeof collaborations.$inferSelect & { requester: typeof users.$inferSelect, receiver: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/collaborations',
      input: insertCollaborationSchema.extend({ receiverId: z.string() }),
      responses: {
        201: z.custom<typeof collaborations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/collaborations/:id/status',
      input: z.object({ status: z.enum(['accepted', 'rejected']) }),
      responses: {
        200: z.custom<typeof collaborations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
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
