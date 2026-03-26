/**
 * seed-ingredients.ts
 *
 * Populates the MealIngredient table with all ingredients from TheMealDB,
 * translated to French via LibreTranslate.
 * Manual overrides correct known machine translation issues.
 *
 * Run inside the Docker container:
 *   npx tsx prisma/seed-ingredients.ts
 *
 * Or via entrypoint.sh (automatic if table is empty / not enough FR translations).
 *
 * The script is idempotent: it upserts each ingredient.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MEALDB_INGREDIENTS_URL = 'https://www.themealdb.com/api/json/v1/1/list.php?i=list';
const LIBRETRANSLATE_URL = process.env['LIBRETRANSLATE_URL'] ?? 'http://translate:5000';

/**
 * Manual overrides for ingredients where machine translation produces degraded output.
 * - Same as English (no real translation found)
 * - Translated a recipe phrase instead of the ingredient name
 * - HTML/XML artifacts in translation
 * - Correct translations that differ from the English name
 */
const TRANSLATION_OVERRIDES: Record<string, string> = {
  // ── Corrections of machine phrase-translation errors ───────────────────────
  'Egg': 'Œuf',
  'Butter': 'Beurre',
  'Caster Sugar': 'Sucre en poudre',
  'Blue Food Colouring': 'Colorant alimentaire bleu',
  'Red Food Colouring': 'Colorant alimentaire rouge',
  'Chicken Stock Cube': 'Cube de bouillon de poule',
  'Thai Green Curry Paste': 'Pâte de curry vert thaï',
  'Pitted Black Olives': 'Olives noires dénoyautées',
  'Chilled Butter': 'Beurre froid',
  'Lemongrass Stalks': 'Tiges de citronnelle',
  'Pears': 'Poires',
  'Dried Shrimp': 'Crevettes séchées',
  'Cooked Beetroot': 'Betteraves cuites',
  'sweet chilli sauce': 'Sauce chili douce',
  'Silken Tofu': 'Tofu soyeux',
  'Light Brown Soft Sugar': 'Sucre roux clair',
  'Vine Tomatoes': 'Tomates en grappe',
  'Ground Clove': 'Clou de girofle moulu',
  // ── Common ingredients with better French names ────────────────────────────
  'Ginger': 'Gingembre',
  'Cream': 'Crème',
  'Peaches': 'Pêches',
  'Orange': 'Orange',
  'Prunes': 'Pruneaux',
  'Sage': 'Sauge',
  'Herring': 'Hareng',
  'Sardines': 'Sardines',
  'Rum': 'Rhum',
  'Sherry': 'Xérès',
  'Bacon': 'Bacon',
  'Squash': 'Courge',
  'Broccoli': 'Brocoli',
  'Zucchini': 'Courgette',
  // ── Proper names / borrowed words — kept as-is intentionally ──────────────
  // (Mozzarella, Parmesan, Ricotta, Mascarpone, etc. are the same in French)
};

// Small delay between requests to avoid hammering the translation service on first boot
const BATCH_DELAY_MS = 100;

interface MealDBIngredient {
  idIngredient: string;
  strIngredient: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Translate a single ingredient name via LibreTranslate */
async function translateOne(text: string): Promise<string> {
  try {
    const res = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'fr',
        format: 'text',
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return text;
    const data = (await res.json()) as { translatedText?: string };
    if (data.translatedText) {
      return data.translatedText;
    }
    return text;
  } catch {
    return text;
  }
}

async function main() {
  console.log('🌿 Seeding MealIngredient table...');

  // Check if already populated with real FR translations
  const count = await prisma.mealIngredient.count();
  // Count rows where nameFr is different from nameEn (= actually translated)
  const translated = count > 0
    ? (await prisma.$queryRaw<[{ c: bigint }]>`
        SELECT COUNT(*) AS c FROM "MealIngredient" WHERE "nameFr" != "nameEn"
      `)[0].c
    : 0n;

  if (count > 0 && translated > 100n) {
    console.log(`✅ Already populated (${count} ingredients, ${translated} with FR translations). Skipping.`);
    return;
  }

  if (count > 0) {
    console.log(`⚠️  ${count} ingredients in DB but only ${translated} translated — re-running translations...`);
  }

  // Fetch all ingredients from MealDB
  console.log('📡 Fetching ingredients from TheMealDB...');
  const res = await fetch(MEALDB_INGREDIENTS_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`MealDB error: ${res.status}`);

  const data = (await res.json()) as { meals: MealDBIngredient[] };
  const ingredients = data.meals.map((m) => m.strIngredient).filter(Boolean);
  console.log(`📋 ${ingredients.length} ingredients to translate via LibreTranslate`);

  const pairs: { nameEn: string; nameFr: string }[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const nameEn = ingredients[i];
    // Use manual override if available, otherwise translate via LibreTranslate
    const nameFr = TRANSLATION_OVERRIDES[nameEn] ?? await translateOne(nameEn);
    pairs.push({ nameEn, nameFr });

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`  Progress: ${i + 1}/${ingredients.length}\n`);
    }

    await sleep(BATCH_DELAY_MS);
  }

  // Upsert all
  console.log(`💾 Upserting ${pairs.length} ingredients into DB...`);

  let inserted = 0;
  for (const pair of pairs) {
    await prisma.mealIngredient.upsert({
      where: { nameEn: pair.nameEn },
      update: { nameFr: pair.nameFr },
      create: pair,
    });
    inserted++;
  }

  console.log(`✨ Done — ${inserted} ingredients stored.`);
}

main()
  .catch((e) => {
    console.error('❌ seed-ingredients failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
