import {extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  name: z.string(),
});

const userWithCreatedAtSchema = userSchema.extend({
  createdAt: z.string(),
});

const announcementSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.enum(["sale", "service", "job", "other"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: userSchema,
});

const announcementCreateSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.enum(["sale", "service", "job", "other"]),
});

const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const paginatedAnnouncementsSchema = z.object({
  data: z.array(announcementSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    totalPages: z.number(),
    perPage: z.number(),
  }),
});

registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  }
);

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            username: z.string(),
            email: z.string().email(),
            password: z.string(),
            name: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created",
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    409: {
      description: "Username or email already taken",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            username: z.string(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            refreshToken: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token refreshed",
      content: {
        "application/json": {
          schema: refreshResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Logged out",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user",
      content: {
        "application/json": {
          schema: userWithCreatedAtSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  request: {
    query: z.object({
      search: z.string().optional(),
      sort: z.enum(["newest", "oldest"]).optional(),
      page: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of announcements",
      content: {
        "application/json": {
          schema: paginatedAnnouncementsSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Single announcement",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    404: {
      description: "Not found",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/announcements",
  tags: ["Announcements"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: announcementCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Announcement created",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: announcementCreateSchema
            .partial()
            .refine(
              data => Object.keys(data).length > 0,
              {
                message: "At least one field required",
              }
            ),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Announcement updated",
      content: {
        "application/json": {
          schema: announcementSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
    },
    404: {
      description: "Not found",
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    204: {
      description: "Announcement deleted",
    },
    403: {
      description: "Forbidden",
    },
    404: {
      description: "Not found",
    },
  },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Announcements API",
      version: "1.0.0",
      description: "REST API for announcements project",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  });
}
