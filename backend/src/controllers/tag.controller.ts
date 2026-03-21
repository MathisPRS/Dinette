import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function listTags(req: Request, res: Response): Promise<void> {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      _count: { select: { recipes: true } },
    },
  });
  res.json({ data: tags });
}
