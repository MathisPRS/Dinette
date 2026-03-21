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

export function FavoritesPage() {
  const navigate = useNavigate();
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
      setFavorites((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <AppLayout>
      <div className="sticky top-0 z-30 bg-gray-50 px-4 pt-safe pt-4 pb-3">
        <h1 className="text-xl font-bold text-gray-900">Favorites</h1>
        <p className="text-xs text-gray-500 mt-0.5">{favorites.length} saved recipe{favorites.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Heart size={40} className="text-gray-300" />}
            title="No favorites yet"
            description="Tap the heart on any recipe to save it here."
            action={<Button onClick={() => navigate('/')}>Browse recipes</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
