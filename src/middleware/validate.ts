import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";


export function validateBody(schema: ZodSchema) {

  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({errors: result.error.flatten()});
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({errors: result.error.flatten()});
    }

    Object.assign(req.params, result.data);
    next();
  };
}

export function validateQuery(schema: ZodSchema) {

  return (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({errors: result.error.flatten()});
    }

    Object.assign(req.query, result.data);
    next();
  };
}