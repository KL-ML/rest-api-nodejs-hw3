import { JwtPayload } from "../middleware/authenticate.ts";


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};