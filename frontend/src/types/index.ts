export type Category = 'STARTER' | 'MAIN' | 'DESSERT';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  order: number;
}

export interface Step {
  id: string;
  description: string;
  order: number;
}

export interface RecipeSummary {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  category: Category;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  createdAt: string;
  updatedAt: string;
  groupId?: string | null;
  author: { id: string; name: string };
  tags: Tag[];
  isFavorite: boolean;
  _count: { favorites: number };
}

export interface Recipe extends RecipeSummary {
  ingredients: Ingredient[];
  steps: Step[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecipeFilters {
  search?: string;
  category?: Category;
  tags?: string[];
  ingredient?: string;
  groupId?: string;
  page?: number;
  limit?: number;
}

export interface RecipeFormData {
  title: string;
  description?: string;
  coverImage?: string | null;
  category: Category;
  servings: number;
  prepTime?: number;
  cookTime?: number;
  ingredients: { name: string; quantity?: string; unit?: string; order: number }[];
  steps: { description: string; order: number }[];
  tags: string[];
  groupId?: string | null;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}

export interface GroupMember {
  userId: string;
  groupId: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  members: GroupMember[];
  _count: { recipes: number };
  joinedAt?: string;
}

// ── External recipe (TheMealDB) ──────────────────────────────────────────────

export interface ExternalIngredient {
  name: string;
  measure: string;
}

export interface ExternalRecipe {
  id: string;
  source: 'mealdb' | 'spoonacular';
  title: string;
  image: string;
  category: string;
  area: string;
  instructions: string;
  steps: string[];
  ingredients: ExternalIngredient[];
  tags: string[];
  youtube: string | null;
  sourceUrl: string | null;
}
