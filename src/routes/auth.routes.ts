import { Router } from "express";

import {register, login, refresh, logout, me} from "../controllers/auth.controller.ts";
import {validateBody} from "../middleware/validate.ts";
import {registerSchema, loginSchema} from "../validators/auth.validator.ts";
import { authenticate } from "../middleware/authenticate.ts";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);

authRouter.post("/login", validateBody(loginSchema), login);

authRouter.post("/refresh", refresh);

authRouter.post("/logout", authenticate, logout);

authRouter.get("/me", authenticate, me);