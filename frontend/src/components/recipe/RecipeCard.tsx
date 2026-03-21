import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import type { RecipeSummary } from '@/types';
import { CATEGORY_LABELS, formatTime, getImageUrl } from '@/utils';
import { favoritesApi } from '@/api/favorites';
import { useAuthStore } from '@/store/auth';
import { useRecipeSheet } from '@/context/RecipeSheetContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface RecipeCardProps {
  recipe: RecipeSummary;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => void;
}

export function RecipeCard({ recipe, onFavoriteToggle }: RecipeCardProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openSheet } = useRecipeSheet();
  const [isFavorite, setIsFavorite] = useState(recipe.isFavorite);
  const [loading, setLoading] = useState(false);

  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      if (isFavorite) {
        await favoritesApi.remove(recipe.id);
        setIsFavorite(false);
        onFavoriteToggle?.(recipe.id, false);
      } else {
        await favoritesApi.add(recipe.id);
        setIsFavorite(true);
        onFavoriteToggle?.(recipe.id, true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150"
      onClick={() => openSheet(recipe.id)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <img
          src={getImageUrl(recipe.coverImage)}
          alt={recipe.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="48">🍽️</text></svg>';
          }}
        />
        <button
          onClick={handleFavorite}
          disabled={loading}
          className={clsx(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center',
            'bg-white/80 backdrop-blur-sm shadow-sm',
            'transition-colors active:scale-90',
            isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          )}
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <span className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-full text-gray-700">
          {CATEGORY_LABELS[recipe.category]}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
          {totalTime > 0 && <span>⏱ {formatTime(totalTime)}</span>}
          <span>👥 {recipe.servings}</span>
        </div>
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
