/**
 * seed-ingredients.ts
 *
 * Populates the MealIngredient table from the static ingredients.json file.
 * No external API calls, no translation service needed.
 * All 272 ingredients have hand-curated EN + FR names.
 *
 * Run inside the Docker container:
 *   npx tsx prisma/seed-ingredients.ts
 *
 * Idempotent: upserts on nameEn, marks all rows isMain=true.
 */

import { PrismaClient } from '@prisma/client';
import { createRequire } from 'module';

const prisma = new PrismaClient();
const require = createRequire(import.meta.url);

interface Ingredient {
  nameEn: string;
  nameFr: string;
}

async function main() {
  console.log('🌿 Seeding MealIngredient table from static JSON...');

  const ingredients: Ingredient[] = require('./ingredients.json');

  // Check if already seeded with the same count
  const count = await prisma.mealIngredient.count();
  if (count >= ingredients.length) {
    console.log(`✅ Already populated (${count} ingredients). Skipping.`);
    return;
  }

  console.log(`📋 Upserting ${ingredients.length} ingredients...`);

  let upserted = 0;
  for (const ing of ingredients) {
    await prisma.mealIngredient.upsert({
      where: { nameEn: ing.nameEn },
      update: { nameFr: ing.nameFr, isMain: true },
      create: { nameEn: ing.nameEn, nameFr: ing.nameFr, isMain: true },
    });
    upserted++;
  }

  console.log(`✨ Done — ${upserted} ingredients seeded.`);
}

main()
  .catch((e) => {
    console.error('❌ seed-ingredients failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
