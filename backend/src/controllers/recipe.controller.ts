import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { Category } from '@prisma/client';

/**
 * Delete a local upload file given its URL path (e.g. "/uploads/uuid.jpg").
 * Silently ignores missing files or non-local paths.
 */
function deleteUploadedFile(coverImage: string | null | undefined): void {
  if (!coverImage) return;
  // Only delete files stored locally (path starts with /uploads/)
  if (!coverImage.startsWith('/uploads/')) return;
  const filename = path.basename(coverImage);
  const filePath = path.resolve(config.upload.dir, filename);
  fs.unlink(filePath, () => { /* ignore errors */ });
}

const ingredientSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  quantity: z.string().max(50).trim().optional(),
  unit: z.string().max(50).trim().optional(),
  order: z.number().int().min(0).default(0),
});

const stepSchema = z.object({
  description: z.string().min(1).trim(),
  order: z.number().int().min(0),
});

const recipeBodySchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  category: z.nativeEnum(Category),
  servings: z.number().int().min(1).max(100).default(4),
  prepTime: z.number().int().min(0).optional(),
  cookTime: z.number().int().min(0).optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
  tags: z.array(z.string().min(1).max(50).trim().toLowerCase()).default([]),
  groupId: z.string().optional().nullable(),
});

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.nativeEnum(Category).optional(),
  tags: z.string().optional(), // comma-separated
  ingredient: z.string().optional(),
  groupId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const recipeSelect = {
  id: true,
  title: true,
  description: true,
  coverImage: true,
  category: true,
  servings: true,
  prepTime: true,
  cookTime: true,
  createdAt: true,
  updatedAt: true,
  groupId: true,
  author: { select: { id: true, name: true } },
  tags: { select: { tag: { select: { id: true, name: true } } } },
  _count: { select: { favorites: true } },
};

const recipeDetailSelect = {
  ...recipeSelect,
  ingredients: { orderBy: { order: 'asc' as const } },
  steps: { orderBy: { order: 'asc' as const } },
};

function extractId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

export async function listRecipes(req: Request, res: Response): Promise<void> {
  const query = listQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: 'Invalid query parameters' });
    return;
  }

  const { search, category, tags, ingredient, groupId, page, limit } = query.data;
  const skip = (page - 1) * limit;

  const tagArray = tags ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

  const userId = req.user!.userId;

  // If filtering by group, verify membership
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }
  }

  const where = {
    // Personal recipes: only the authenticated user's; group recipes: filtered by groupId
    ...(groupId !== undefined ? { groupId } : { groupId: null, authorId: userId }),
    ...(search && {
      title: { contains: search, mode: 'insensitive' as const },
    }),
    ...(category && { category }),
    ...(tagArray.length > 0 && {
      tags: { some: { tag: { name: { in: tagArray } } } },
    }),
    ...(ingredient && {
      ingredients: { some: { name: { contains: ingredient, mode: 'insensitive' as const } } },
    }),
  };

  const [recipes, total] = await prisma.$transaction([
    prisma.recipe.findMany({
      where,
      select: recipeSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  // Attach favorite status
  let favoriteIds = new Set<string>();
  {
    const favorites = await prisma.favorite.findMany({
      where: { userId, recipeId: { in: recipes.map((r) => r.id) } },
      select: { recipeId: true },
    });
    favoriteIds = new Set(favorites.map((f) => f.recipeId));
  }

  const data = recipes.map((r) => ({
    ...r,
    tags: r.tags.map((rt) => rt.tag),
    isFavorite: favoriteIds.has(r.id),
  }));

  res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function getRecipe(req: Request, res: Response): Promise<void> {
  const id = extractId(req.params['id']);

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: recipeDetailSelect,
  });

  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const userId = req.user!.userId;
  let isFavorite = false;
  const fav = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId: id } },
  });
  isFavorite = !!fav;

  res.json({
    ...recipe,
    tags: recipe.tags.map((rt) => rt.tag),
    isFavorite,
  });
}

export async function createRecipe(req: Request, res: Response): Promise<void> {
  const result = recipeBodySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const { ingredients, steps, tags, groupId, ...recipeData } = result.data;
  const userId = req.user!.userId;

  // If assigning to a group, verify membership
  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this group' });
      return;
    }
  }

  // Upsert tags
  const tagRecords = await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name }, select: { id: true } })
    )
  );

  const recipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      authorId: userId,
      groupId: groupId ?? null,
      ingredients: { create: ingredients },
      steps: { create: steps },
      tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
    },
    select: recipeDetailSelect,
  });

  res.status(201).json({ ...recipe, tags: recipe.tags.map((rt) => rt.tag) });
}

export async function updateRecipe(req: Request, res: Response): Promise<void> {
  const id = extractId(req.params['id']);
  const userId = req.user!.userId;

  const existing = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true, groupId: true } });
  if (!existing) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  // Allow if author OR a member of the recipe's group
  const canEdit = existing.authorId === userId ||
    (existing.groupId !== null && await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: existing.groupId } },
    }).then(Boolean));

  if (!canEdit) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const result = recipeBodySchema.partial().safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  const { ingredients, steps, tags, ...recipeData } = result.data;

  // Upsert tags if provided
  let tagRecords: { id: string }[] = [];
  if (tags !== undefined) {
    tagRecords = await Promise.all(
      tags.map((name) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name }, select: { id: true } })
      )
    );
  }

  // Run deletions then update in a transaction
  await prisma.$transaction(async (tx) => {
    if (ingredients !== undefined) {
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
    }
    if (steps !== undefined) {
      await tx.step.deleteMany({ where: { recipeId: id } });
    }
    if (tags !== undefined) {
      await tx.recipeTag.deleteMany({ where: { recipeId: id } });
    }
    await tx.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ...(ingredients && { ingredients: { create: ingredients } }),
        ...(steps && { steps: { create: steps } }),
        ...(tags !== undefined && {
          tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
        }),
      },
    });
  });

  // Fetch the full updated recipe with relations
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: recipeDetailSelect,
  });

  res.json({ ...recipe, tags: recipe!.tags.map((rt) => rt.tag) });
}

export async function deleteRecipe(req: Request, res: Response): Promise<void> {
  const id = extractId(req.params['id']);
  const userId = req.user!.userId;

  const existing = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true, coverImage: true, groupId: true } });
  if (!existing) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  // Allow if author OR a member of the recipe's group
  const canDelete = existing.authorId === userId ||
    (existing.groupId !== null && await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: existing.groupId } },
    }).then(Boolean));

  if (!canDelete) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  await prisma.recipe.delete({ where: { id } });

  // Clean up cover image file from disk after DB deletion
  deleteUploadedFile(existing.coverImage);

  res.status(204).send();
}

export async function suggestRecipe(req: Request, res: Response): Promise<void> {
  const rawCategory = req.query['category'];
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

  const where = category ? { category: category as Category } : {};
  const count = await prisma.recipe.count({ where });

  if (count === 0) {
    res.status(404).json({ error: 'No recipes found' });
    return;
  }

  const skip = Math.floor(Math.random() * count);
  const recipes = await prisma.recipe.findMany({
    where,
    select: recipeDetailSelect,
    take: 1,
    skip,
  });

  const recipe = recipes[0];
  res.json({ ...recipe, tags: recipe.tags.map((rt) => rt.tag) });
}

export async function updateCoverImage(req: Request, res: Response): Promise<void> {
  const id = extractId(req.params['id']);
  const userId = req.user!.userId;

  const existing = await prisma.recipe.findUnique({ where: { id }, select: { authorId: true, coverImage: true } });
  if (!existing) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  if (existing.authorId !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' });
    return;
  }

  const coverImage = `/uploads/${req.file.filename}`;
  await prisma.recipe.update({ where: { id }, data: { coverImage } });

  // Delete the old cover image file from disk
  deleteUploadedFile(existing.coverImage);

  res.json({ coverImage });
}
