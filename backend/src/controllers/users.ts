import { Router, Response } from "express";
import { prisma } from "../index";
import { authenticate } from "../middleware/auth";
import { AuthRequest } from "../types";

export const userController = Router();

userController.get("/", authenticate, async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });
  res.json({ success: true, data: users });
});
