import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { favoritesApi } from '@/api/favorites';
import type { RecipeSummary } from '@/types';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useT } from '@/i18n';

export function FavoritesPage() {
  const navigate = useNavigate();
  const t = useT();
  const [favorites, setFavorites] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    favoritesApi
      .list()
      .then(setFavorites)
      .finally(() => setLoading(false));
  }, []);

  function handleFavoriteToggle(id: string, isFav: boolean) {
    if (!isFav) {
      // Recipe was removed from favorites — remove it from the list
      setFavorites((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const countLabel =
    favorites.length === 1
      ? t('favorites_count_one')
      : t('favorites_count_other', { count: favorites.length });

  return (
    <AppLayout>
      <div className="sticky top-0 z-30 bg-gray-50 lg:static lg:bg-transparent px-4 lg:px-0 pt-4 lg:pt-0 pb-3">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{t('favorites_title')}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{countLabel}</p>
      </div>

      <div className="px-4 lg:px-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Heart size={40} className="text-gray-300" />}
            title={t('favorites_empty_title')}
            description={t('favorites_empty_description')}
            action={<Button onClick={() => navigate('/')}>{t('favorites_empty_browse')}</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
