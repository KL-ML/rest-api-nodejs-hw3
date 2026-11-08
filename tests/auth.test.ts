import { describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../src/app.ts";
import { generateTokens } from "../src/utils/tokens.ts";

describe("Password hashing", () => {
  it("should hash a password and verify it", async () => {
    const password = "password123";

    const hashedPassword = await bcrypt.hash(password, 10);

    expect(hashedPassword).not.toBe(password);

    const isValid = await bcrypt.compare(
      password,
      hashedPassword
    );

    expect(isValid).toBe(true);
  });
});

describe("JWT tokens", () => {
  it("should generate valid access and refresh tokens", () => {
    process.env.JWT_SECRET = "test-secret";

    const { accessToken, refreshToken } =
      generateTokens(2);

    const accessPayload = jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload;

    const refreshPayload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET
    ) as jwt.JwtPayload;

    expect(accessPayload.sub).toBe(2);
    expect(refreshPayload.sub).toBe(2);
  });
});

describe("POST /auth/login", () => {
  it("should return 401 for invalid password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        username: "nina_test",
        password: "wrong-password"
      });

    expect(response.status).toBe(401);
  });
});