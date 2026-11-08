import "dotenv/config";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttpModule from "pino-http";

import swaggerUi from "swagger-ui-express";

import { authRouter } from "./routes/auth.routes.ts";
import { announcementsRouter } from "./routes/announcements.routes.ts";
import { generateOpenApiDocument } from "./openapi.ts";
import logger from "./logger.ts";
import errorMiddleware from "./middleware/errorMiddleware.ts";

const pinoHttp = pinoHttpModule as any;

const app = express();

app.use(helmet());

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(pinoHttp({logger,}));

app.use(express.json());

app.use("/auth", authRouter);
app.use("/announcements", announcementsRouter);


app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(generateOpenApiDocument())
);

app.use(errorMiddleware);

export default app;