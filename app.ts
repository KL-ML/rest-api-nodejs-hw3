import "dotenv/config";

import express from "express";

import swaggerUi from "swagger-ui-express";

import { authRouter } from "./src/routes/auth.routes.ts";
import { announcementsRouter } from "./src/routes/announcements.routes.ts";
import { generateOpenApiDocument } from "./src/openapi.ts";

const app = express();

app.use(express.json());

app.use("/auth", authRouter);
app.use("/announcements", announcementsRouter);


app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(generateOpenApiDocument())
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
