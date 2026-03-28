import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const LIBRETRANSLATE_URL = process.env['LIBRETRANSLATE_URL'] ?? 'http://translate:5000';
const SPOONACULAR_API_KEY = process.env['SPOONACULAR_API_KEY'] ?? '';
const SPOONACULAR_BASE = 'https://api.spoonacular.com';

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

// ── Shared result type (source-agnostic) ─────────────────────────────────────

interface NormalizedMeal {
  id: string;
  source: 'mealdb' | 'spoonacular';
  title: string;
  image: string | null;
  category: string;
  area: string;
  instructions: string;
  steps: string[];
  ingredients: { name: string; measure: string }[];
  tags: string[];
  youtube: string | null;
  sourceUrl: string | null;
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

// ── Types Spoonacular ────────────────────────────────────────────────────────

interface SpoonacularSearchResult {
  id: number;
  title: string;
  image: string;
}

interface SpoonacularSearchResponse {
  results: SpoonacularSearchResult[];
  totalResults: number;
}

interface SpoonacularExtendedIngredient {
  original: string;
  name: string;
  amount: number;
  unit: string;
}

interface SpoonacularAnalyzedStep {
  number: number;
  step: string;
}

interface SpoonacularAnalyzedInstruction {
  steps: SpoonacularAnalyzedStep[];
}

interface SpoonacularRecipeDetail {
  id: number;
  title: string;
  image: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions: string;
  analyzedInstructions: SpoonacularAnalyzedInstruction[];
  extendedIngredients: SpoonacularExtendedIngredient[];
  sourceUrl: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function mealdbFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`TheMealDB error: ${res.status}`);
  return res.json() as Promise<T>;
}

async function spoonacularFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!SPOONACULAR_API_KEY) throw new Error('SPOONACULAR_API_KEY is not set');
  const url = new URL(`${SPOONACULAR_BASE}${path}`);
  url.searchParams.set('apiKey', SPOONACULAR_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Spoonacular error: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
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

/** Normalize a MealDetail into our shared NormalizedMeal shape */
function normalizeMeal(meal: MealDetail): NormalizedMeal {
  return {
    id: `mealdb:${meal.idMeal}`,
    source: 'mealdb',
    title: meal.strMeal,
    image: meal.strMealThumb,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    steps: extractSteps(meal.strInstructions),
    ingredients: extractIngredients(meal),
    tags: [
      ...(meal.strTags ? meal.strTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) : []),
      ...(meal.strCategory ? [meal.strCategory.trim().toLowerCase()] : []),
      ...(meal.strArea && meal.strArea.toLowerCase() !== 'unknown' ? [meal.strArea.trim().toLowerCase()] : []),
    ].filter((v, i, arr) => v && arr.indexOf(v) === i),
    youtube: meal.strYoutube || null,
    sourceUrl: meal.strSource || null,
  };
}

/** Normalize a Spoonacular recipe detail into our shared NormalizedMeal shape */
function normalizeSpoonacular(recipe: SpoonacularRecipeDetail): NormalizedMeal {
  // Extract steps from analyzedInstructions (preferred) or fallback to plain instructions
  let steps: string[] = [];
  if (recipe.analyzedInstructions?.length > 0) {
    steps = recipe.analyzedInstructions
      .flatMap((section) => section.steps)
      .sort((a, b) => a.number - b.number)
      .map((s) => s.step.trim())
      .filter(Boolean);
  } else if (recipe.instructions) {
    steps = extractSteps(stripHtml(recipe.instructions));
  }

  // Build ingredient list
  const ingredients = (recipe.extendedIngredients ?? []).map((ing) => ({
    name: ing.name,
    measure: ing.amount && ing.unit ? `${ing.amount} ${ing.unit}`.trim() : ing.original,
  }));

  // Build tags from cuisines + dishTypes + diets
  const tags = [
    ...recipe.cuisines.map((c) => c.toLowerCase()),
    ...recipe.dishTypes.map((d) => d.toLowerCase()),
    ...recipe.diets.map((d) => d.toLowerCase()),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  return {
    id: `spoonacular:${recipe.id}`,
    source: 'spoonacular',
    title: recipe.title,
    image: recipe.image || null,
    category: recipe.dishTypes?.[0] ?? '',
    area: recipe.cuisines?.[0] ?? '',
    instructions: stripHtml(recipe.instructions ?? ''),
    steps,
    ingredients,
    tags,
    youtube: null,
    sourceUrl: recipe.sourceUrl || null,
  };
}

// ── Search helpers ───────────────────────────────────────────────────────────

/** Search TheMealDB by ingredient, returns up to 12 normalized meals */
async function searchMealDB(
  ingredient: string,
  categoryFilter?: string,
  areaFilter?: string,
): Promise<NormalizedMeal[]> {
  const filterData = await mealdbFetch<{ meals: MealSummary[] | null }>(
    `${MEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`
  );
  if (!filterData.meals || filterData.meals.length === 0) return [];

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

  if (categoryFilter) meals = meals.filter((m) => m.category.toLowerCase() === categoryFilter);
  if (areaFilter) meals = meals.filter((m) => m.area.toLowerCase() === areaFilter);

  return meals.slice(0, 12);
}

/** Search Spoonacular by ingredient, returns up to 12 normalized meals */
async function searchSpoonacular(
  ingredient: string,
  categoryFilter?: string,
  areaFilter?: string,
): Promise<NormalizedMeal[]> {
  if (!SPOONACULAR_API_KEY) return [];

  const params: Record<string, string> = {
    includeIngredients: ingredient,
    number: '12',
    addRecipeInformation: 'true',
    instructionsRequired: 'true',
    fillIngredients: 'false',
  };
  if (categoryFilter) params['type'] = categoryFilter;
  if (areaFilter) params['cuisine'] = areaFilter;

  const data = await spoonacularFetch<SpoonacularSearchResponse>('/recipes/complexSearch', params);
  return (data.results as unknown as SpoonacularRecipeDetail[]).map(normalizeSpoonacular);
}

// ── Controllers ─────────────────────────────────────────────────────────────

/**
 * GET /api/suggest/search?ingredient=chicken&category=Chicken&area=French
 *
 * Searches TheMealDB and Spoonacular in parallel and merges results.
 * Results are interleaved (alternating sources) for variety.
 * Returns up to 24 results total.
 */
export async function searchExternal(req: Request, res: Response): Promise<void> {
  const ingredient = (req.query['ingredient'] as string | undefined)?.trim();
  const categoryFilter = (req.query['category'] as string | undefined)?.trim().toLowerCase();
  const areaFilter = (req.query['area'] as string | undefined)?.trim().toLowerCase();

  if (!ingredient) {
    res.status(400).json({ error: 'ingredient query parameter is required' });
    return;
  }

  // Run both sources in parallel — failures are silenced (empty array fallback)
  const [mealdbResults, spoonacularResults] = await Promise.all([
    searchMealDB(ingredient, categoryFilter, areaFilter).catch(() => [] as NormalizedMeal[]),
    searchSpoonacular(ingredient, categoryFilter, areaFilter).catch(() => [] as NormalizedMeal[]),
  ]);

  // Interleave results for variety (mealdb[0], spoonacular[0], mealdb[1], ...)
  const merged: NormalizedMeal[] = [];
  const maxLen = Math.max(mealdbResults.length, spoonacularResults.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < mealdbResults.length) merged.push(mealdbResults[i]);
    if (i < spoonacularResults.length) merged.push(spoonacularResults[i]);
  }

  res.json({ meals: merged.slice(0, 24) });
}

/**
 * GET /api/suggest/detail/:id?locale=fr&source=mealdb|spoonacular
 *
 * Fetch a single recipe by id.
 * id format:
 *   - TheMealDB: plain numeric string (e.g. "52772") or "mealdb:52772"
 *   - Spoonacular: "spoonacular:716429"
 *
 * If locale != 'en', translates title, steps, ingredient names and tags via LibreTranslate.
 */
export async function getExternalDetail(req: Request, res: Response): Promise<void> {
  let rawId = Array.isArray(req.params['id']) ? req.params['id'][0] : req.params['id'];
  if (!rawId) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  const locale = (req.query['locale'] as string | undefined)?.trim().toLowerCase() ?? 'en';

  // Determine source from id prefix or query param
  let source: 'mealdb' | 'spoonacular' = 'mealdb';
  if (rawId.startsWith('spoonacular:')) {
    source = 'spoonacular';
    rawId = rawId.slice('spoonacular:'.length);
  } else if (rawId.startsWith('mealdb:')) {
    source = 'mealdb';
    rawId = rawId.slice('mealdb:'.length);
  }
  const srcOverride = (req.query['source'] as string | undefined)?.trim().toLowerCase();
  if (srcOverride === 'spoonacular') source = 'spoonacular';

  let meal: NormalizedMeal;

  if (source === 'spoonacular') {
    const recipe = await spoonacularFetch<SpoonacularRecipeDetail>(`/recipes/${encodeURIComponent(rawId)}/information`);
    meal = normalizeSpoonacular(recipe);
  } else {
    const data = await mealdbFetch<{ meals: MealDetail[] | null }>(
      `${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(rawId)}`
    );
    if (!data.meals || data.meals.length === 0) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    meal = normalizeMeal(data.meals[0]);
  }

  // ── Translate everything if locale is not EN ────────────────────────────────
  if (locale !== 'en') {
    const ingNames    = meal.ingredients.map((i) => i.name);
    const ingMeasures = meal.ingredients.map((i) => i.measure);
    const allTexts = [
      meal.title,
      ...meal.steps,
      ...ingNames,
      ...ingMeasures,
      ...meal.tags,
    ];

    const translated = await translateBatch(allTexts, locale);

    let cursor = 0;
    meal.title       = translated[cursor++];
    meal.steps       = meal.steps.map(() => translated[cursor++]);
    // names first pass
    const translatedNames    = meal.ingredients.map(() => translated[cursor++]);
    // measures second pass
    const translatedMeasures = meal.ingredients.map(() => translated[cursor++]);
    meal.ingredients = meal.ingredients.map((ing, i) => ({
      ...ing,
      name:    translatedNames[i],
      measure: translatedMeasures[i],
    }));
    meal.tags = meal.tags.map(() => translated[cursor++]);
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
 * Return MealIngredient rows from DB (nameEn + nameFr), sorted by nameFr.
 * By default only returns main ingredients (isMain=true).
 * Pass ?all=1 to include derivatives.
 */
export async function getIngredients(req: Request, res: Response): Promise<void> {
  const showAll = req.query['all'] === '1';
  const rows = await prisma.mealIngredient.findMany({
    where: showAll ? undefined : { isMain: true },
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
