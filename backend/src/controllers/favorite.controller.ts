import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

function extractId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  const recipeId = extractId(req.params['id']);
  const userId = req.user!.userId;

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId }, select: { id: true } });
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    update: {},
    create: { userId, recipeId },
  });

  res.status(201).json({ message: 'Added to favorites' });
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  const recipeId = extractId(req.params['id']);
  const userId = req.user!.userId;

  await prisma.favorite.deleteMany({ where: { userId, recipeId } });
  res.status(204).send();
}

export async function listFavorites(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      recipe: {
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          category: true,
          servings: true,
          prepTime: true,
          cookTime: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
          tags: { select: { tag: { select: { id: true, name: true } } } },
          _count: { select: { favorites: true } },
        },
      },
    },
  });

  const data = favorites.map((f) => ({
    ...f.recipe,
    tags: f.recipe.tags.map((rt) => rt.tag),
    isFavorite: true,
  }));

  res.json({ data });
}
