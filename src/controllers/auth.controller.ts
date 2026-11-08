import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../../prisma/client.ts";
import { generateTokens } from "../utils/tokens.ts";
import logger from "../logger.ts";

interface JwtPayload {sub: number;}

export async function register(req: Request, res: Response) {

  const {username, email, password, name} = req.body;

  const existingUser = await prisma.user.findFirst({
      where:{OR:[{ username }, {email}]}
    });

  if(existingUser){
    return res.status(409).json({message: "Username or email already taken"});
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({data:{username, email, password: hashedPassword, name}});
  logger.info({userId: user.id, username: user.username}, "User registered");
  const {accessToken, refreshToken} = generateTokens(user.id);

  await prisma.refreshToken.create({
    data:{token: refreshToken, userId: user.id}});

  res.status(201).json({
    user:{
      id:user.id,
      username:user.username,
      email:user.email,
      name:user.name
    },
    accessToken,
    refreshToken
  });
}

export async function login(req: Request, res: Response){
  const {username, password} = req.body;

  const user = await prisma.user.findUnique({
      where:{username}
    });

  if(!user){
    return res.status(401).json({message: "Invalid credentials"});
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if(!passwordValid){
    return res.status(401).json({message: "Invalid credentials"});
  }

  logger.info({userId: user.id, username: user.username}, "User logged in");

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.refreshToken.deleteMany({
    where:{userId:user.id}
  });

  await prisma.refreshToken.create({
    data:{token:refreshToken, userId:user.id}
  });

  res.json({
    user:{
      id:user.id,
      username:user.username,
      email:user.email,
      name:user.name
    },
    accessToken,
    refreshToken
  });
}

export async function refresh(req: Request, res: Response){

  const {refreshToken} = req.body;

  if(!refreshToken){
    return res.status(401).json({ message: "Unauthorized" });
  }

  const storedToken = await prisma.refreshToken.findUnique({
      where:{ token:refreshToken }
    });

  if(!storedToken){
    return res.status(401).json({ message: "Unauthorized" });
  }

  let decoded: JwtPayload;

  try{
    decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET!
      ) as unknown as JwtPayload;

    if(!decoded.sub){
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  catch(error){
    return res.status(401).json({ message: "Unauthorized" });
  }

  await prisma.refreshToken.delete({
    where:{ token:refreshToken }
  });

  const tokens = generateTokens(decoded.sub);

  await prisma.refreshToken.create({
    data:{
      token:
        tokens.refreshToken,
      userId:
        decoded.sub
    }
  });

  res.json(tokens);
}

export async function logout(req: Request, res: Response){

  const userId = req.user!.sub;
  await prisma.refreshToken.deleteMany({
    where:{userId}
  });
  res.status(204).end();
}

export async function me(req: Request, res: Response){

  const userId = req.user!.sub;
  const user = await prisma.user.findUnique({
      where:{id:userId},
      select:{
        id:true,
        username:true,
        email:true,
        name:true,
        createdAt:true
      }
    });

  if(!user){
    return res.status(404).json({message: "User not found"});
  }

  res.json(user);
}