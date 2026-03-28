/**
 * mark-main-ingredients.ts
 *
 * Marks MealIngredient rows as isMain=true when they represent a primary
 * ingredient (e.g. "Chicken", "Beef") rather than a derivative/cut/preparation
 * (e.g. "Chicken Thighs", "Ground Beef", "Smoked Bacon").
 *
 * Logic:
 *   - An ingredient is "main" if its English name does NOT contain any of the
 *     derivative qualifier words defined in DERIVATIVE_KEYWORDS.
 *   - Explicit overrides (FORCE_MAIN / FORCE_DERIVED) take priority.
 *
 * Run inside the Docker container:
 *   npx tsx prisma/mark-main-ingredients.ts
 *
 * Idempotent: safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Words that, when present in an ingredient name, indicate it is a derivative,
 * cut, preparation or processed version rather than a base ingredient.
 * Checked as whole words (word-boundary match, case-insensitive).
 */
const DERIVATIVE_KEYWORDS = [
  // Animal cuts / parts
  'thigh', 'thighs',
  'wing', 'wings',
  'breast', 'breasts',
  'leg', 'legs',
  'loin', 'loins',
  'tenderloin',
  'drumstick', 'drumsticks',
  'shank', 'shanks',
  'belly',
  'rib', 'ribs',
  'chop', 'chops',
  'fillet', 'fillets',
  'filet', 'filets',
  'cutlet', 'cutlets',
  'brisket',
  'chuck',
  'rump',
  'sirloin',
  'flank',
  'shoulder',
  'knuckle',
  'neck',
  'cheek',
  'liver',
  'kidney', 'kidneys',
  'heart',
  'tripe',
  'tongue',
  'tail',
  'oxtail',
  'bone', 'bones',
  'rack',
  'crown',
  'whole',
  'half',
  'quarter',
  // Preparation states
  'ground',
  'minced',
  'chopped',
  'sliced',
  'diced',
  'shredded',
  'grated',
  'crushed',
  'crumbled',
  'smoked',
  'dried',
  'frozen',
  'canned',
  'cooked',
  'boiled',
  'roasted',
  'grilled',
  'fried',
  'baked',
  'pickled',
  'marinated',
  'salted',
  'unsalted',
  'raw',
  'fresh',   // e.g. "Fresh Parsley" — we want "Parsley" as main
  'dried',
  'powdered',
  'flaked',
  'rolled',
  'instant',
  'condensed',
  'evaporated',
  'skimmed',
  'semi-skimmed',
  'low-fat',
  'fat-free',
  'full-fat',
  'light',
  // Packaging / form qualifiers
  'tin', 'tinned',
  'jar',
  'packet',
  'bag',
  'spray',
  'extract',
  'concentrate',
  'paste',    // e.g. "Tomato Paste" — base: "Tomato"
  'puree',
  'sauce',    // e.g. "Soy Sauce" — keep as-is if no main exists
  'stock',
  'broth',
  'cube',
  'powder',
  'flakes',
  'flake',
  'granules',
  'mix',
  'blend',
  'seasoning',
  'stuffing',
  'breadcrumbs',
  // Size / age qualifiers
  'baby',
  'mini',
  'large',
  'small',
  'medium',
  'thick',
  'thin',
  'young',
  'mature',
  'old',
  // Colour qualifiers that create sub-variants (not the base ingredient)
  // NOTE: we keep colour-only ingredients like "Red Onion", "Green Bean" as they are
  // distinct ingredients — only exclude when combined with cuts/forms above
];

/**
 * Ingredients that should be forced to isMain=true regardless of keyword matches
 * (e.g. compound names that are genuinely a single base ingredient).
 */
const FORCE_MAIN = new Set([
  'Ground Almonds',       // "Ground" qualifier but this IS the main form used in recipes
  'Almond Extract',       // Extract but it's the primary form
  'Vanilla Extract',
  'Baking Powder',
  'Baking Soda',
  'Tomato Paste',         // Primary pantry staple
  'Tomato Sauce',         // Primary pantry staple
  'Soy Sauce',
  'Fish Sauce',
  'Hot Sauce',
  'Oyster Sauce',
  'Worcestershire Sauce',
  'Tabasco Sauce',
  'Hoisin Sauce',
  'BBQ Sauce',
  'Teriyaki Sauce',
  'Sriracha',
  'Miso',
  'Chicken Stock',
  'Beef Stock',
  'Vegetable Stock',
  'Fish Stock',
  'Chicken Broth',
  'Beef Broth',
  'Vegetable Broth',
  'Cream Cheese',
  'Cream of Tartar',
  'Sour Cream',
  'Coconut Cream',
  'Coconut Milk',
  'Almond Milk',
  'Oat Milk',
  'Dried Thyme',
  'Dried Oregano',
  'Dried Rosemary',
  'Dried Basil',
  'Dried Parsley',
  'Dried Mint',
  'Dried Sage',
  'Dried Dill',
  'Dried Chives',
  'Dried Coriander',
  'Dried Bay Leaves',
  'Dried Tarragon',
  'Dried Marjoram',
  'Dried Chilli Flakes',
  'Red Pepper Flakes',
  'Chilli Flakes',
  'Smoked Paprika',
  'Smoked Salmon',
  'Smoked Haddock',
  'Smoked Bacon',         // Bacon is already primarily smoked
  'Minced Beef',
  'Minced Pork',
  'Minced Lamb',
  'Minced Turkey',
  'Ground Beef',
  'Ground Pork',
  'Ground Lamb',
  'Ground Turkey',
  'Ground Chicken',
  'Diced Tomatoes',
  'Canned Tomatoes',
  'Tinned Tomatoes',
  'Chopped Tomatoes',
  'Fresh Ginger',
  'Fresh Thyme',
  'Fresh Basil',
  'Fresh Parsley',
  'Fresh Coriander',
  'Fresh Mint',
  'Fresh Dill',
  'Fresh Rosemary',
  'Fresh Sage',
  'Fresh Chives',
  'Fresh Bay Leaves',
  'Rolled Oats',
  'Instant Coffee',
  'Condensed Milk',
  'Evaporated Milk',
  'Skim Milk',
]);

/**
 * Ingredients that should be forced to isMain=false (derivatives, even if no
 * keyword matches — e.g. very specific cuts with unusual names).
 */
const FORCE_DERIVED = new Set([
  'Chicken Thighs',
  'Chicken Wings',
  'Chicken Breast',
  'Chicken Breasts',
  'Chicken Drumsticks',
  'Chicken Legs',
  'Chicken Tenderloins',
  'Chicken Stock Cube',
  'Beef Brisket',
  'Beef Chuck',
  'Beef Sirloin',
  'Beef Fillet',
  'Pork Belly',
  'Pork Shoulder',
  'Pork Loin',
  'Pork Chops',
  'Lamb Chops',
  'Lamb Shoulder',
  'Lamb Shank',
  'Salmon Fillets',
  'Cod Fillets',
  'Tuna Steaks',
]);

function buildWordRegex(word: string): RegExp {
  // Escape special regex characters in the keyword
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

function isMainIngredient(nameEn: string): boolean {
  if (FORCE_MAIN.has(nameEn)) return true;
  if (FORCE_DERIVED.has(nameEn)) return false;

  for (const keyword of DERIVATIVE_KEYWORDS) {
    if (buildWordRegex(keyword).test(nameEn)) return false;
  }
  return true;
}

async function main() {
  console.log('🏷️  Marking main ingredients...');

  const total = await prisma.mealIngredient.count();
  const alreadyMarked = await prisma.mealIngredient.count({ where: { isMain: true } });

  // Skip if already done (>100 marked and ratio looks reasonable)
  if (alreadyMarked > 100) {
    console.log(`✅ Already marked (${alreadyMarked}/${total} main). Skipping.`);
    return;
  }

  const all = await prisma.mealIngredient.findMany({
    select: { id: true, nameEn: true },
  });

  console.log(`📋 ${all.length} ingredients to process`);

  let mainCount = 0;
  let derivedCount = 0;

  for (const ing of all) {
    const main = isMainIngredient(ing.nameEn);
    await prisma.mealIngredient.update({
      where: { id: ing.id },
      data: { isMain: main },
    });
    if (main) mainCount++;
    else derivedCount++;
  }

  console.log(`✨ Done — ${mainCount} main, ${derivedCount} derived`);

  // Show a sample of what was marked as main
  const sample = await prisma.mealIngredient.findMany({
    where: { isMain: true },
    select: { nameEn: true, nameFr: true },
    orderBy: { nameFr: 'asc' },
    take: 20,
  });
  console.log('\n📌 Sample of main ingredients:');
  sample.forEach((i) => console.log(`  ${i.nameEn} → ${i.nameFr}`));
}

main()
  .catch((e) => {
    console.error('❌ mark-main-ingredients failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
