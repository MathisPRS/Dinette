import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const LIBRETRANSLATE_URL = process.env['LIBRETRANSLATE_URL'] ?? 'http://translate:5000';

// ── Translation cache (in-memory, lives for process lifetime) ────────────────
const translationCache = new Map<string, string>();

/** Translate an array of strings EN→target via LibreTranslate (with cache). */
async function translateBatch(texts: string[], target: string): Promise<string[]> {
  const cacheKey = (t: string) => `${target}::${t}`;

  const uncached = texts.filter((t) => t && !translationCache.has(cacheKey(t)));

  if (uncached.length > 0) {
    await Promise.allSettled(
      uncached.map(async (text) => {
        try {
          const r = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              q: text,
              source: 'en',
              target,
              format: 'text',
            }),
            signal: AbortSignal.timeout(15000),
          });
          if (r.ok) {
            const d = (await r.json()) as { translatedText?: string };
            if (d.translatedText) {
              translationCache.set(cacheKey(text), d.translatedText);
              return;
            }
          }
        } catch { /* ignore */ }
        translationCache.set(cacheKey(text), text); // fallback: keep original
      })
    );
  }

  return texts.map((t) => translationCache.get(cacheKey(t)) ?? t);
}

// ── Types TheMealDB ─────────────────────────────────────────────────────────

interface MealSummary {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

interface MealDetail extends MealSummary {
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  // strIngredient1..20 + strMeasure1..20
  [key: string]: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function mealdbFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`TheMealDB error: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Extract ingredients list from a MealDetail object */
function extractIngredients(meal: MealDetail): { name: string; measure: string }[] {
  const result: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim()) {
      result.push({ name: name.trim(), measure: (measure ?? '').trim() });
    }
  }
  return result;
}

/** Split instructions into steps array */
function extractSteps(instructions: string): string[] {
  return instructions
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/** Normalize a MealDetail into our external recipe shape */
function normalizeMeal(meal: MealDetail) {
  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    steps: extractSteps(meal.strInstructions),
    ingredients: extractIngredients(meal),
    tags: [
      // strTags (ex: "Pasta,Baking") — may be null
      ...(meal.strTags ? meal.strTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : []),
      // Always add category and area as tags (ex: "chicken", "italian")
      ...(meal.strCategory ? [meal.strCategory.trim().toLowerCase()] : []),
      ...(meal.strArea && meal.strArea.toLowerCase() !== 'unknown' ? [meal.strArea.trim().toLowerCase()] : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i), // deduplicate
    youtube: meal.strYoutube || null,
    source: meal.strSource || null,
  };
}

// ── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/suggest/search?ingredient=chicken&category=Chicken&area=French
 *
 * 1. Filter by ingredient via TheMealDB (returns summaries only)
 * 2. Fetch full detail for each result (up to 12) to get category/area/etc.
 * 3. Apply optional category/area filter server-side
 */
export async function searchExternal(req: Request, res: Response): Promise<void> {
  const ingredient = (req.query['ingredient'] as string | undefined)?.trim();
  const categoryFilter = (req.query['category'] as string | undefined)?.trim().toLowerCase();
  const areaFilter = (req.query['area'] as string | undefined)?.trim().toLowerCase();

  if (!ingredient) {
    res.status(400).json({ error: 'ingredient query parameter is required' });
    return;
  }

  // Step 1: get meal summaries matching the ingredient
  const filterUrl = `${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`;
  const filterData = await mealdbFetch<{ meals: MealSummary[] | null }>(filterUrl);

  if (!filterData.meals || filterData.meals.length === 0) {
    res.json({ meals: [] });
    return;
  }

  // Step 2: fetch full details for up to 16 meals (to allow filtering)
  const ids = filterData.meals.slice(0, 16).map((m) => m.idMeal);
  const detailResults = await Promise.allSettled(
    ids.map((id) =>
      mealdbFetch<{ meals: MealDetail[] | null }>(`${MEALDB_BASE}/lookup.php?i=${id}`)
    )
  );

  let meals = detailResults
    .filter((r): r is PromiseFulfilledResult<{ meals: MealDetail[] | null }> => r.status === 'fulfilled')
    .flatMap((r) => r.value.meals ?? [])
    .map(normalizeMeal);

  // Step 3: optional client-side filters
  if (categoryFilter) {
    meals = meals.filter((m) => m.category.toLowerCase() === categoryFilter);
  }
  if (areaFilter) {
    meals = meals.filter((m) => m.area.toLowerCase() === areaFilter);
  }

  res.json({ meals: meals.slice(0, 12) });
}

/**
 * GET /api/suggest/detail/:id?locale=fr
 * Fetch a single meal by TheMealDB id.
 * If locale=fr, translates title, steps, ingredient names and tags via LibreTranslate.
 */
export async function getExternalDetail(req: Request, res: Response): Promise<void> {
  const id = Array.isArray(req.params['id']) ? req.params['id'][0] : req.params['id'];
  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const locale = (req.query['locale'] as string | undefined)?.trim().toLowerCase() ?? 'en';

  const data = await mealdbFetch<{ meals: MealDetail[] | null }>(
    `${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`
  );

  if (!data.meals || data.meals.length === 0) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }

  const meal = normalizeMeal(data.meals[0]);

  // ── Translate everything if locale is not EN ────────────────────────────────
  if (locale !== 'en') {
    const ingNames = meal.ingredients.map((i) => i.name);

    // Gather all texts in a deterministic order
    const allTexts = [
      meal.title,
      ...meal.steps,
      ...ingNames,
      ...meal.tags,
    ];

    const translated = await translateBatch(allTexts, locale);

    let cursor = 0;
    meal.title      = translated[cursor++];
    meal.steps      = meal.steps.map(() => translated[cursor++]);
    meal.ingredients = meal.ingredients.map((ing) => ({ ...ing, name: translated[cursor++] }));
    meal.tags       = meal.tags.map(() => translated[cursor++]);
  }

  res.json({ meal });
}

/**
 * GET /api/suggest/categories
 * Return all MealDB categories
 */
export async function getCategories(_req: Request, res: Response): Promise<void> {
  const data = await mealdbFetch<{ categories: { strCategory: string }[] }>(
    `${MEALDB_BASE}/categories.php`
  );
  const categories = (data.categories ?? []).map((c) => c.strCategory).sort();
  res.json({ categories });
}

/**
 * GET /api/suggest/areas
 * Return all MealDB areas (cuisines)
 */
export async function getAreas(_req: Request, res: Response): Promise<void> {
  const data = await mealdbFetch<{ meals: { strArea: string }[] }>(
    `${MEALDB_BASE}/list.php?a=list`
  );
  const areas = (data.meals ?? []).map((m) => m.strArea).sort();
  res.json({ areas });
}

/**
 * GET /api/suggest/ingredients
 * Return all MealIngredient rows from DB (nameEn + nameFr), sorted by nameFr
 */
export async function getIngredients(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.mealIngredient.findMany({
    select: { nameEn: true, nameFr: true },
    orderBy: { nameFr: 'asc' },
  });
  res.json({ ingredients: rows });
}

/**
 * POST /api/suggest/translate
 * Body: { texts: string[], target?: string }
 * Translate an array of strings from EN to target (default: fr).
 */
export async function translateTexts(req: Request, res: Response): Promise<void> {
  const { texts, target = 'fr' } = req.body as { texts: string[]; target?: string };

  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'texts must be a non-empty array' });
    return;
  }

  const translations = await translateBatch(texts, target);
  res.json({ translations });
}
