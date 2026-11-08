import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {sub: number;}

export function authenticate(req: Request, res: Response, next: NextFunction) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({message:"Unauthorized"});
  }

  const parts = authHeader.split(" ");

  if ( parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({message:"Unauthorized"});
  }

  const token = parts[1];

  try {
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as unknown as JwtPayload;

    if (!decoded.sub) {
      return res.status(401).json({message:"Unauthorized"});
    }
    req.user = decoded;
    next();

  } catch(error) {
    console.error("Auth error:", error);
    return res.status(401).json({message:"Unauthorized"});
  }
}