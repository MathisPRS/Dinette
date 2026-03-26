import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import { tagsApi } from '@/api/tags';
import type { RecipeSummary, Category } from '@/types';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeFiltersBar } from '@/components/recipe/RecipeFiltersBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useRecipeSheet } from '@/context/RecipeSheetContext';
import { useT } from '@/i18n';

const LIMIT = 20;

export function HomePage() {
  const navigate = useNavigate();
  const t = useT();
  const { onDeleted } = useRecipeSheet();

  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());

  // Remove deleted recipe from list with a short exit animation
  useEffect(() => {
    return onDeleted((id) => {
      // 1. Mark as leaving → triggers CSS animation
      setLeavingIds((prev) => new Set(prev).add(id));
      // 2. After animation ends, remove from list
      setTimeout(() => {
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 400);
    });
  }, [onDeleted]);

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
    tagsApi.list().then((tags) => setAvailableTags(tags.map((tag) => tag.name)));
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

  function handleFavoriteToggle(id: string, isFav: boolean) {
    // Sync isFavorite state in the list when toggled from RecipeCard
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isFavorite: isFav } : r))
    );
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecipes(false);
  }

  const recipeCountLabel =
    total === 1
      ? t('home_recipe_count_one')
      : t('home_recipe_count_other', { count: total });

  return (
    <AppLayout>
      {/* Page header */}
      <div className="sticky top-0 z-30 bg-gray-50 lg:static lg:bg-transparent px-4 lg:px-0 pt-4 lg:pt-0 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            {/* Title shown on mobile only — sidebar has logo on desktop */}
            <h1 className="text-xl font-bold text-gray-900 lg:hidden">{t('home_title_mobile')}</h1>
            <h1 className="hidden lg:block text-2xl font-bold text-gray-900">{t('home_title_desktop')}</h1>
            <p className="text-xs text-gray-500">{recipeCountLabel}</p>
          </div>
          <button
            onClick={() => navigate('/recipes/new')}
            className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-sm active:scale-95 transition-transform lg:hidden"
            aria-label={t('home_add_recipe')}
          >
            <Plus size={20} />
          </button>
          <Button
            onClick={() => navigate('/recipes/new')}
            className="hidden lg:flex items-center gap-2"
          >
            <Plus size={16} />
            {t('home_add_recipe')}
          </Button>
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
            title={t('home_empty_title')}
            description={
              search || activeCategory || activeTags.length
                ? t('home_empty_filtered')
                : t('home_empty_default')
            }
            action={
              <Button onClick={() => navigate('/recipes/new')}>{t('home_empty_add')}</Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  leaving={leavingIds.has(recipe.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>

            {recipes.length < total && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                >
                  {t('home_load_more')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
