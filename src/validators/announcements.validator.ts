import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
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