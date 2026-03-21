import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
}
