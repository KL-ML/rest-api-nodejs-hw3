import { Request, Response } from "express";
import prisma from "../../prisma/client.ts";
import fs from "fs/promises";

import uploadToCloudinary from "../cloudinary.ts";
import logger from "../logger.ts";

function formatAnnouncement(announcement: any) {
  const { userId, ...result } = announcement;
  return result;
}

export async function getAnnouncements( req: Request, res: Response ) {
  const {
    search,
    sort = "newest",
    page = 1
  } = req.query as any;

  const limit = 10;
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * limit;

  const where = search
    ? {
        title: {
          contains: String(search),
          mode: "insensitive" as const
        }
      }
    : undefined;

  const announcements = await prisma.announcement.findMany({
      where,
      orderBy: {
        createdAt:
          sort === "oldest"
            ? "asc"
            : "desc"
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        }
      }
    });


  const total = await prisma.announcement.count({where});

  return res.json({
    data: announcements.map(formatAnnouncement),
    pagination: {
      total,
      page: currentPage,
      totalPages:
        Math.ceil(total / limit),
      perPage: limit
    }       
  });
}

export async function getAnnouncementById(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(404).json({message: "Not found"});
  }

  const announcement = await prisma.announcement.findUnique({
      where: {id},
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        }
      }
    });

  if (!announcement) {
    return res.status(404).json({message: "Not found"});
  }

  return res.json(formatAnnouncement(announcement));
}

export async function createAnnouncement(req: Request, res: Response) {
  const userId = req.user!.sub;
  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadToCloudinary(req.file.path);
      await fs.unlink(req.file.path);
      logger.info({userId, imageUrl}, "Announcement photo uploaded");
    } catch (error) {

      try {
        await fs.unlink(req.file.path);
      } catch {}
      logger.error({error}, "Failed to upload announcement photo");

      return res.status(500).json({message: "Failed to upload image"});
    }
  }


  const announcement =
    await prisma.announcement.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        price: Number(req.body.price),
        category: req.body.category,
        imageUrl,
        userId
      },

      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        }
      }
    });

    logger.info({announcementId: announcement.id, userId}, "Announcement created");

  return res.status(201).json(formatAnnouncement(announcement));
}

export async function updateAnnouncement(req: Request, res: Response) {

  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(404).json({message: "Not found"});
  }

  const userId = req.user!.sub;

  const existing = await prisma.announcement.findUnique({
      where: {id}
    });

  if (!existing) {
    return res.status(404).json({message: "Not found"});
  }

  if (existing.userId !== userId) {
    return res.status(403).json({message: "Access denied"});
  }

  let imageUrl = existing.imageUrl ?? undefined;

  if (req.file) {
    try {
      imageUrl = await uploadToCloudinary(req.file.path);
      await fs.unlink(req.file.path);

      logger.info({announcementId: id, userId, imageUrl}, "Announcement photo uploaded");
    } catch (error) {

      try {
        await fs.unlink(req.file.path);
      } catch {}

      logger.error({error, announcementId: id}, "Failed to upload announcement photo");

      return res.status(500).json({message: "Failed to upload image"});
    }
  }

  const updated = await prisma.announcement.update({
      where: {id},
      data: {
        title:
          req.body.title !== undefined
            ? req.body.title
            : undefined,

        description:
          req.body.description !== undefined
            ? req.body.description
            : undefined,

        price:
          req.body.price !== undefined
            ? Number(req.body.price)
            : undefined,

        category:
          req.body.category !== undefined
            ? req.body.category
            : undefined,

        imageUrl
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true
          }
        }
      }
    });

  logger.info({announcementId: updated.id, userId}, "Announcement updated");

  return res.json(formatAnnouncement(updated));
}

export async function deleteAnnouncement(req: Request, res: Response) {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(404).json({message: "Not found"});
  }

  const userId = req.user!.sub;

  const announcement = await prisma.announcement.findUnique({
      where: {id}
    });

  if (!announcement) {
    return res.status(404).json({message: "Not found"});
  }

  if (announcement.userId !== userId) {
    return res.status(403).json({message: "Access denied"});
  }

  await prisma.announcement.delete({
    where: {id}
  });

  return res.status(204).end();
}