import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import { tagsApi } from '@/api/tags';
import { useAuthStore } from '@/store/auth';
import type { RecipeSummary, Category } from '@/types';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeFiltersBar } from '@/components/recipe/RecipeFiltersBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';

const LIMIT = 20;

export function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | undefined>();
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Load tags
  useEffect(() => {
    tagsApi.list().then((tags) => setAvailableTags(tags.map((t) => t.name)));
  }, []);

  const fetchRecipes = useCallback(
    async (resetPage = true) => {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await recipeApi.list({
          search: search || undefined,
          category: activeCategory,
          tags: activeTags.length ? activeTags : undefined,
          page: currentPage,
          limit: LIMIT,
        });

        if (resetPage) {
          setRecipes(data.data);
          setPage(1);
        } else {
          setRecipes((prev) => [...prev, ...data.data]);
        }
        setTotal(data.total);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, activeCategory, activeTags, page]
  );

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchRecipes(true), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search, activeCategory, activeTags]);

  function handleTagToggle(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(false);
  }

  return (
    <AppLayout>
      {/* Page header */}
      <div className="sticky top-0 z-30 bg-gray-50 lg:static lg:bg-transparent px-4 lg:px-0 pt-safe pt-4 lg:pt-0 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            {/* Title shown on mobile only — sidebar has logo on desktop */}
            <h1 className="text-xl font-bold text-gray-900 lg:hidden">Dinette</h1>
            <h1 className="hidden lg:block text-2xl font-bold text-gray-900">Recettes</h1>
            <p className="text-xs text-gray-500">{total} recette{total !== 1 ? 's' : ''}</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => navigate('/recipes/new')}
              className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform lg:hidden"
              aria-label="Add recipe"
            >
              <Plus size={20} />
            </button>
          )}
          {isAuthenticated && (
            <Button
              onClick={() => navigate('/recipes/new')}
              className="hidden lg:flex items-center gap-2"
            >
              <Plus size={16} />
              Nouvelle recette
            </Button>
          )}
        </div>
        <RecipeFiltersBar
          search={search}
          onSearchChange={setSearch}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeTags={activeTags}
          onTagToggle={handleTagToggle}
          availableTags={availableTags}
        />
      </div>

      {/* Content */}
      <div className="px-4 lg:px-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon="🍳"
            title="Aucune recette"
            description={
              search || activeCategory || activeTags.length
                ? 'Aucune recette ne correspond à vos filtres. Essayez de les modifier.'
                : 'Commencez à construire votre carnet de recettes !'
            }
            action={
              isAuthenticated ? (
                <Button onClick={() => navigate('/recipes/new')}>Ajouter une recette</Button>
              ) : (
                <Button onClick={() => navigate('/login')}>Se connecter pour ajouter</Button>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {recipes.length < total && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
