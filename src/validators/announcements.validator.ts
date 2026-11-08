import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.coerce.number(),
  category: z.enum(["sale", "service", "job", "other"])
})

export const createAnnouncementSchema = announcementSchema;
export const updateAnnouncementSchema = announcementSchema.partial().refine(
  data => Object.keys(data).length > 0, {message: "At least one field required"}
);

export const announcementIdSchema = z.object({id:z.string()});

export const announcementQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["newest", "oldest"]).optional(),
  page: z.string().optional()
});