import { Router } from "express";

import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from "../controllers/announcements.controller.ts";

import { authenticate } from "../middleware/authenticate.ts";

import {validateBody, validateParams, validateQuery} from "../middleware/validate.ts";

import {createAnnouncementSchema, updateAnnouncementSchema, announcementIdSchema, announcementQuerySchema} from "../validators/announcements.validator.ts";

export const announcementsRouter = Router();

announcementsRouter.get("/", validateQuery(announcementQuerySchema), getAnnouncements);

announcementsRouter.get("/:id", validateParams(announcementIdSchema), getAnnouncementById);

announcementsRouter.post("/", authenticate, validateBody(createAnnouncementSchema), createAnnouncement);

announcementsRouter.patch("/:id", authenticate, validateParams(announcementIdSchema), validateBody(updateAnnouncementSchema), updateAnnouncement);

announcementsRouter.delete("/:id", authenticate, validateParams(announcementIdSchema), deleteAnnouncement);