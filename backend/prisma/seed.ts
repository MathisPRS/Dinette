import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient();

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

const isProduction = process.env.NODE_ENV === 'production';
const shouldSeedTestUser = parseBool(process.env.SEED_TEST_USER, !isProduction);
const shouldSeedDemoRecipes = parseBool(process.env.SEED_DEMO_RECIPES, !isProduction);

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL ?? 'chef@dinette.app';
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Tprzo.40!!';
const SEED_USER_NAME = process.env.SEED_USER_NAME ?? 'Chef Marie';

const recipes = [
  {
    title: 'Classic French Onion Soup',
    description: 'A rich, deeply flavourful soup topped with crusty bread and melted Gruyère cheese.',
    category: 'STARTER' as const,
    servings: 4,
    prepTime: 15,
    cookTime: 60,
    tags: ['french', 'soup', 'comfort-food', 'vegetarian'],
    ingredients: [
      { name: 'Yellow onions', quantity: '6', unit: 'large', order: 0 },
      { name: 'Unsalted butter', quantity: '4', unit: 'tbsp', order: 1 },
      { name: 'Olive oil', quantity: '2', unit: 'tbsp', order: 2 },
      { name: 'Dry white wine', quantity: '150', unit: 'ml', order: 3 },
      { name: 'Beef or vegetable stock', quantity: '1.5', unit: 'L', order: 4 },
      { name: 'Fresh thyme', quantity: '4', unit: 'sprigs', order: 5 },
      { name: 'Bay leaf', quantity: '1', unit: '', order: 6 },
      { name: 'Baguette slices', quantity: '8', unit: '', order: 7 },
      { name: 'Gruyère cheese, grated', quantity: '200', unit: 'g', order: 8 },
      { name: 'Salt and black pepper', quantity: '', unit: '', order: 9 },
    ],
    steps: [
      { description: 'Slice the onions thinly. Melt butter with olive oil in a large heavy-bottomed pot over medium-low heat.', order: 0 },
      { description: 'Add the onions and a pinch of salt. Cook, stirring occasionally, for 45 minutes until deeply caramelised and golden brown.', order: 1 },
      { description: 'Add the white wine and scrape up any browned bits. Cook for 2 minutes until nearly evaporated.', order: 2 },
      { description: 'Pour in the stock, add thyme and bay leaf. Simmer for 15 minutes. Season with salt and pepper.', order: 3 },
      { description: 'Ladle the soup into oven-safe bowls. Top each with two baguette slices and a generous handful of Gruyère.', order: 4 },
      { description: 'Broil for 3–4 minutes until the cheese is bubbling and golden. Serve immediately.', order: 5 },
    ],
  },
  {
    title: 'Spaghetti Carbonara',
    description: 'The authentic Roman pasta — silky, creamy sauce made purely from eggs, Pecorino, guanciale and black pepper.',
    category: 'MAIN' as const,
    servings: 4,
    prepTime: 10,
    cookTime: 20,
    tags: ['italian', 'pasta', 'quick', 'classic'],
    ingredients: [
      { name: 'Spaghetti', quantity: '400', unit: 'g', order: 0 },
      { name: 'Guanciale or pancetta', quantity: '200', unit: 'g', order: 1 },
      { name: 'Egg yolks', quantity: '4', unit: '', order: 2 },
      { name: 'Whole egg', quantity: '1', unit: '', order: 3 },
      { name: 'Pecorino Romano, finely grated', quantity: '80', unit: 'g', order: 4 },
      { name: 'Parmesan, finely grated', quantity: '40', unit: 'g', order: 5 },
      { name: 'Coarsely ground black pepper', quantity: '2', unit: 'tsp', order: 6 },
      { name: 'Salt', quantity: '', unit: '', order: 7 },
    ],
    steps: [
      { description: 'Bring a large pot of salted water to a boil. Cook spaghetti until al dente. Reserve 1 cup of pasta water before draining.', order: 0 },
      { description: 'While pasta cooks, cut guanciale into small cubes and fry in a dry pan over medium heat until crispy. Remove from heat.', order: 1 },
      { description: 'Whisk together egg yolks, whole egg, Pecorino, Parmesan and a generous amount of black pepper in a bowl.', order: 2 },
      { description: 'Add hot drained pasta to the guanciale pan. Remove from heat. Quickly add the egg mixture, tossing vigorously.', order: 3 },
      { description: 'Add pasta water a splash at a time, tossing, until you have a glossy, creamy sauce that clings to each strand.', order: 4 },
      { description: 'Serve immediately with extra Pecorino and black pepper.', order: 5 },
    ],
  },
  {
    title: 'Chocolate Fondant',
    description: 'Individual warm chocolate cakes with a gooey molten centre — a dinner party classic that can be made ahead.',
    category: 'DESSERT' as const,
    servings: 4,
    prepTime: 20,
    cookTime: 12,
    tags: ['chocolate', 'dessert', 'french', 'dinner-party'],
    ingredients: [
      { name: 'Dark chocolate (70%)', quantity: '150', unit: 'g', order: 0 },
      { name: 'Unsalted butter', quantity: '120', unit: 'g', order: 1 },
      { name: 'Eggs', quantity: '3', unit: '', order: 2 },
      { name: 'Egg yolks', quantity: '3', unit: '', order: 3 },
      { name: 'Caster sugar', quantity: '90', unit: 'g', order: 4 },
      { name: 'Plain flour', quantity: '35', unit: 'g', order: 5 },
      { name: 'Cocoa powder for dusting', quantity: '', unit: '', order: 6 },
      { name: 'Vanilla ice cream to serve', quantity: '', unit: '', order: 7 },
    ],
    steps: [
      { description: 'Melt chocolate and butter together in a heatproof bowl set over barely simmering water. Stir until smooth. Set aside to cool slightly.', order: 0 },
      { description: 'Butter 4 ramekins generously and dust with cocoa powder. Tap out any excess.', order: 1 },
      { description: 'Whisk eggs, yolks and sugar together until pale and thick, about 3 minutes.', order: 2 },
      { description: 'Fold the chocolate mixture into the egg mixture, then sift in the flour and fold gently until just combined.', order: 3 },
      { description: 'Divide between the prepared ramekins. Can be refrigerated at this point for up to 24 hours.', order: 4 },
      { description: 'Bake at 200 °C (180 °C fan) for 10–12 minutes, until the edges are set but the centre still has a slight wobble.', order: 5 },
      { description: 'Run a knife around the edge, invert onto a plate, and serve immediately with vanilla ice cream.', order: 6 },
    ],
  },
  {
    title: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato and pepper sauce — a vibrant Middle Eastern breakfast or any-time meal.',
    category: 'MAIN' as const,
    servings: 3,
    prepTime: 10,
    cookTime: 25,
    tags: ['middle-eastern', 'eggs', 'vegetarian', 'quick', 'spicy'],
    ingredients: [
      { name: 'Olive oil', quantity: '3', unit: 'tbsp', order: 0 },
      { name: 'Onion, diced', quantity: '1', unit: 'large', order: 1 },
      { name: 'Red bell pepper, diced', quantity: '2', unit: '', order: 2 },
      { name: 'Garlic cloves, minced', quantity: '4', unit: '', order: 3 },
      { name: 'Ground cumin', quantity: '1.5', unit: 'tsp', order: 4 },
      { name: 'Smoked paprika', quantity: '1', unit: 'tsp', order: 5 },
      { name: 'Cayenne pepper', quantity: '0.25', unit: 'tsp', order: 6 },
      { name: 'Canned crushed tomatoes', quantity: '800', unit: 'g', order: 7 },
      { name: 'Eggs', quantity: '6', unit: '', order: 8 },
      { name: 'Fresh parsley or coriander', quantity: '', unit: '', order: 9 },
      { name: 'Feta cheese to serve', quantity: '80', unit: 'g', order: 10 },
    ],
    steps: [
      { description: 'Heat olive oil in a wide, deep frying pan over medium heat. Add onion and peppers; cook for 8 minutes until softened.', order: 0 },
      { description: 'Add garlic, cumin, paprika and cayenne. Stir and cook for 1 minute until fragrant.', order: 1 },
      { description: 'Pour in the tomatoes. Season with salt and simmer for 10 minutes until the sauce thickens slightly.', order: 2 },
      { description: 'Create 6 small wells in the sauce. Crack an egg into each well.', order: 3 },
      { description: 'Cover and cook for 5–7 minutes until whites are set but yolks are still runny.', order: 4 },
      { description: 'Scatter over fresh herbs and crumbled feta. Serve straight from the pan with crusty bread.', order: 5 },
    ],
  },
  {
    title: 'Thai Green Curry',
    description: 'A fragrant, coconut-rich curry with tender chicken, fresh vegetables and homemade green paste.',
    category: 'MAIN' as const,
    servings: 4,
    prepTime: 20,
    cookTime: 25,
    tags: ['thai', 'curry', 'coconut', 'spicy', 'asian'],
    ingredients: [
      { name: 'Chicken thighs, cut into chunks', quantity: '600', unit: 'g', order: 0 },
      { name: 'Coconut milk', quantity: '400', unit: 'ml', order: 1 },
      { name: 'Thai green curry paste', quantity: '3', unit: 'tbsp', order: 2 },
      { name: 'Fish sauce', quantity: '2', unit: 'tbsp', order: 3 },
      { name: 'Palm sugar or brown sugar', quantity: '1', unit: 'tbsp', order: 4 },
      { name: 'Kaffir lime leaves', quantity: '4', unit: '', order: 5 },
      { name: 'Lemongrass stalk, bruised', quantity: '1', unit: '', order: 6 },
      { name: 'Courgette, sliced', quantity: '1', unit: '', order: 7 },
      { name: 'Baby spinach', quantity: '100', unit: 'g', order: 8 },
      { name: 'Thai basil leaves', quantity: '', unit: 'handful', order: 9 },
      { name: 'Jasmine rice to serve', quantity: '320', unit: 'g', order: 10 },
    ],
    steps: [
      { description: 'Heat a drizzle of oil in a wok or large pan over high heat. Add the curry paste and fry for 1 minute until aromatic.', order: 0 },
      { description: 'Pour in half the coconut milk. Stir into the paste and bring to a rapid simmer.', order: 1 },
      { description: 'Add the chicken. Cook for 5 minutes, turning occasionally, until sealed.', order: 2 },
      { description: 'Pour in the remaining coconut milk. Add fish sauce, sugar, kaffir lime leaves and lemongrass.', order: 3 },
      { description: 'Simmer for 15 minutes until chicken is cooked through. Add courgette and spinach; cook for 2 more minutes.', order: 4 },
      { description: 'Remove lemongrass. Scatter over Thai basil. Serve with steamed jasmine rice.', order: 5 },
    ],
  },
  {
    title: 'Roasted Butternut Squash Soup',
    description: 'A velvety, golden soup with roasted squash, ginger and a swirl of cream — perfect for autumn.',
    category: 'STARTER' as const,
    servings: 6,
    prepTime: 15,
    cookTime: 45,
    tags: ['soup', 'vegetarian', 'vegan', 'autumn', 'comfort-food'],
    ingredients: [
      { name: 'Butternut squash', quantity: '1.5', unit: 'kg', order: 0 },
      { name: 'Olive oil', quantity: '3', unit: 'tbsp', order: 1 },
      { name: 'Onion, roughly chopped', quantity: '1', unit: 'large', order: 2 },
      { name: 'Garlic cloves', quantity: '4', unit: '', order: 3 },
      { name: 'Fresh ginger, grated', quantity: '2', unit: 'tsp', order: 4 },
      { name: 'Ground coriander', quantity: '1', unit: 'tsp', order: 5 },
      { name: 'Vegetable stock', quantity: '1', unit: 'L', order: 6 },
      { name: 'Double cream to serve', quantity: '4', unit: 'tbsp', order: 7 },
      { name: 'Toasted pumpkin seeds', quantity: '2', unit: 'tbsp', order: 8 },
    ],
    steps: [
      { description: 'Preheat oven to 200 °C. Halve the squash, drizzle with oil, and roast cut-side down for 35–40 minutes until tender.', order: 0 },
      { description: 'Meanwhile, soften onion in a large pot with a little oil. Add garlic, ginger and coriander; cook for 1 minute.', order: 1 },
      { description: 'Scoop the squash flesh from the skin and add to the pot with the stock. Bring to a simmer.', order: 2 },
      { description: 'Blend until completely smooth using a stick blender or in batches in a blender.', order: 3 },
      { description: 'Reheat gently. Season well with salt and pepper.', order: 4 },
      { description: 'Serve in warm bowls with a swirl of cream and a sprinkle of pumpkin seeds.', order: 5 },
    ],
  },
  {
    title: 'Lemon Tart (Tarte au Citron)',
    description: 'A classic French patisserie tart with a buttery shortcrust shell and a bright, tangy lemon curd filling.',
    category: 'DESSERT' as const,
    servings: 8,
    prepTime: 30,
    cookTime: 45,
    tags: ['french', 'tart', 'lemon', 'pastry', 'dinner-party'],
    ingredients: [
      { name: 'Plain flour', quantity: '200', unit: 'g', order: 0 },
      { name: 'Icing sugar', quantity: '50', unit: 'g', order: 1 },
      { name: 'Cold unsalted butter, cubed', quantity: '100', unit: 'g', order: 2 },
      { name: 'Egg yolk', quantity: '1', unit: '', order: 3 },
      { name: 'Ice cold water', quantity: '2', unit: 'tbsp', order: 4 },
      { name: 'Eggs (filling)', quantity: '4', unit: '', order: 5 },
      { name: 'Caster sugar (filling)', quantity: '150', unit: 'g', order: 6 },
      { name: 'Lemon juice', quantity: '150', unit: 'ml', order: 7 },
      { name: 'Lemon zest', quantity: '2', unit: 'lemons', order: 8 },
      { name: 'Double cream', quantity: '120', unit: 'ml', order: 9 },
    ],
    steps: [
      { description: 'Make the pastry: pulse flour, icing sugar and butter in a food processor until it resembles breadcrumbs. Add yolk and water; pulse until the dough just comes together.', order: 0 },
      { description: 'Wrap in cling film and chill for 30 minutes. Roll out and line a 23 cm tart tin. Prick the base and chill for 15 minutes.', order: 1 },
      { description: 'Blind bake at 180 °C for 15 minutes with baking beans, then 5 minutes uncovered until golden. Lower oven to 160 °C.', order: 2 },
      { description: 'Whisk eggs, sugar, lemon juice, zest and cream together. Pour through a sieve into the tart shell.', order: 3 },
      { description: 'Bake for 22–25 minutes until the filling has a very slight wobble in the centre.', order: 4 },
      { description: 'Cool completely before slicing. Dust with icing sugar and serve with crème fraîche.', order: 5 },
    ],
  },
  {
    title: 'Beef Bourguignon',
    description: 'The ultimate French braised beef stew with red wine, lardons, pearl onions and mushrooms.',
    category: 'MAIN' as const,
    servings: 6,
    prepTime: 30,
    cookTime: 180,
    tags: ['french', 'beef', 'stew', 'slow-cook', 'dinner-party'],
    ingredients: [
      { name: 'Beef chuck, cut into 4 cm pieces', quantity: '1.5', unit: 'kg', order: 0 },
      { name: 'Burgundy or Pinot Noir', quantity: '750', unit: 'ml', order: 1 },
      { name: 'Lardons or diced bacon', quantity: '200', unit: 'g', order: 2 },
      { name: 'Pearl onions or small shallots', quantity: '300', unit: 'g', order: 3 },
      { name: 'Button mushrooms', quantity: '300', unit: 'g', order: 4 },
      { name: 'Garlic cloves, smashed', quantity: '4', unit: '', order: 5 },
      { name: 'Tomato paste', quantity: '2', unit: 'tbsp', order: 6 },
      { name: 'Beef stock', quantity: '500', unit: 'ml', order: 7 },
      { name: 'Fresh thyme and bay leaves', quantity: '', unit: '', order: 8 },
      { name: 'Plain flour', quantity: '2', unit: 'tbsp', order: 9 },
      { name: 'Butter', quantity: '3', unit: 'tbsp', order: 10 },
    ],
    steps: [
      { description: 'Pat beef dry and season well. Brown in batches in a large Dutch oven with a little oil over high heat. Remove and set aside.', order: 0 },
      { description: 'Fry lardons until crispy. Add pearl onions and brown lightly. Remove and set aside.', order: 1 },
      { description: 'Add garlic and tomato paste to the pot. Cook 1 minute. Sprinkle over flour and stir.', order: 2 },
      { description: 'Pour in the wine and stock. Return beef to the pot. Add thyme and bay leaves. Bring to a simmer.', order: 3 },
      { description: 'Cover and cook in a 160 °C oven for 2.5 hours until the beef is very tender.', order: 4 },
      { description: 'Sauté mushrooms in butter until golden. Add mushrooms, lardons and onions to the stew for the last 20 minutes.', order: 5 },
      { description: 'Serve with creamy mashed potato or crusty baguette.', order: 6 },
    ],
  },
  {
    title: 'Prawn Ceviche',
    description: 'Fresh tiger prawns "cooked" in lime juice with chilli, red onion, cucumber and a touch of avocado.',
    category: 'STARTER' as const,
    servings: 4,
    prepTime: 25,
    cookTime: 0,
    tags: ['seafood', 'latin', 'fresh', 'no-cook', 'light'],
    ingredients: [
      { name: 'Raw tiger prawns, peeled', quantity: '400', unit: 'g', order: 0 },
      { name: 'Lime juice, freshly squeezed', quantity: '150', unit: 'ml', order: 1 },
      { name: 'Red onion, very finely diced', quantity: '0.5', unit: '', order: 2 },
      { name: 'Red chilli, finely sliced', quantity: '1', unit: '', order: 3 },
      { name: 'Cucumber, diced', quantity: '0.5', unit: '', order: 4 },
      { name: 'Ripe avocado, diced', quantity: '1', unit: '', order: 5 },
      { name: 'Fresh coriander', quantity: '', unit: 'large handful', order: 6 },
      { name: 'Sea salt and white pepper', quantity: '', unit: '', order: 7 },
      { name: 'Tortilla chips to serve', quantity: '', unit: '', order: 8 },
    ],
    steps: [
      { description: 'Halve the prawns lengthways. Place in a non-reactive bowl with the lime juice. Stir to coat.', order: 0 },
      { description: 'Refrigerate for 15–20 minutes, stirring occasionally, until the prawns turn pink and opaque throughout.', order: 1 },
      { description: 'Drain off most of the lime juice, reserving a few tablespoons.', order: 2 },
      { description: 'Add red onion, chilli, cucumber and the reserved lime juice. Toss gently.', order: 3 },
      { description: 'Season with sea salt and white pepper. Fold through coriander and avocado just before serving.', order: 4 },
      { description: 'Serve in chilled glasses or small bowls with tortilla chips on the side.', order: 5 },
    ],
  },
  {
    title: 'Crème Brûlée',
    description: 'Silky vanilla custard topped with a crackling caramel shell — the most satisfying dessert to make at home.',
    category: 'DESSERT' as const,
    servings: 6,
    prepTime: 15,
    cookTime: 45,
    tags: ['french', 'vanilla', 'classic', 'dinner-party', 'make-ahead'],
    ingredients: [
      { name: 'Double cream', quantity: '600', unit: 'ml', order: 0 },
      { name: 'Vanilla pod', quantity: '1', unit: '', order: 1 },
      { name: 'Egg yolks', quantity: '6', unit: '', order: 2 },
      { name: 'Caster sugar', quantity: '80', unit: 'g', order: 3 },
      { name: 'Caster sugar for the topping', quantity: '6', unit: 'tbsp', order: 4 },
    ],
    steps: [
      { description: 'Split the vanilla pod and scrape the seeds into the cream. Heat cream over medium heat until steaming — do not boil. Remove from heat and infuse for 10 minutes.', order: 0 },
      { description: 'Whisk egg yolks and 80 g sugar together until pale. Slowly pour in the warm cream, whisking constantly.', order: 1 },
      { description: 'Strain through a fine sieve into a jug to remove any lumps or vanilla pod.', order: 2 },
      { description: 'Pour into 6 ramekins placed in a roasting tin. Fill the tin with boiling water halfway up the sides.', order: 3 },
      { description: 'Bake at 150 °C for 35–40 minutes until the custard has a gentle wobble in the centre. Cool, then refrigerate for at least 4 hours.', order: 4 },
      { description: 'Just before serving, sprinkle 1 tbsp sugar evenly over each custard. Brûlée with a kitchen torch until caramelised and crackling.', order: 5 },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  if (!shouldSeedTestUser) {
    console.log('⏭️  Skipping test user seed (SEED_TEST_USER disabled).');
    return;
  }

  // Upsert seed user
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: SEED_USER_EMAIL },
    update: {},
    create: {
      email: SEED_USER_EMAIL,
      name: SEED_USER_NAME,
      passwordHash,
    },
  });
  console.log(`✅ Seed user: ${user.email}`);

  if (!shouldSeedDemoRecipes) {
    console.log('⏭️  Skipping demo recipes seed (SEED_DEMO_RECIPES disabled).');
    return;
  }

  // Create recipes
  let created = 0;
  for (const r of recipes) {
    const existing = await prisma.recipe.findFirst({
      where: { title: r.title, authorId: user.id },
    });
    if (existing) {
      console.log(`⏭️  Skipping (already exists): ${r.title}`);
      continue;
    }

    // Upsert tags
    const tagRecords = await Promise.all(
      r.tags.map((name) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
      )
    );

    await prisma.recipe.create({
      data: {
        title: r.title,
        description: r.description,
        category: r.category,
        servings: r.servings,
        prepTime: r.prepTime > 0 ? r.prepTime : null,
        cookTime: r.cookTime > 0 ? r.cookTime : null,
        authorId: user.id,
        ingredients: { create: r.ingredients },
        steps: { create: r.steps },
        tags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id })),
        },
      },
    });

    console.log(`🍽️  Created: ${r.title}`);
    created++;
  }

  console.log(`\n✨ Done — ${created} recipe(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
