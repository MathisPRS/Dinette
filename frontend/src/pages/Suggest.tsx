import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle, ChevronRight } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import type { Recipe, Category } from '@/types';
import { CATEGORY_LABELS, getImageUrl, formatTime, extractApiError } from '@/utils';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';
import { clsx } from 'clsx';

const CATEGORIES: { label: string; value: Category | undefined }[] = [
  { label: 'Any category', value: undefined },
  { label: 'Starters', value: 'STARTER' },
  { label: 'Main Courses', value: 'MAIN' },
  { label: 'Desserts', value: 'DESSERT' },
];

export function SuggestPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | undefined>();
  const [suggestion, setSuggestion] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function getSuggestion() {
    setLoading(true);
    setError('');
    try {
      const recipe = await recipeApi.suggest(category);
      setSuggestion(recipe);
    } catch (err) {
      setError(extractApiError(err));
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-safe pt-6 max-w-lg lg:max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎲</div>
          <h1 className="text-2xl font-bold text-gray-900">Not sure what to cook?</h1>
          <p className="text-sm text-gray-500 mt-1">Let Dinette pick something for you</p>
        </div>

        {/* Category selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Filter by category</p>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setCategory(value)}
                className={clsx(
                  'flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors',
                  category === value
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {label}
                {category === value && <span className="text-brand-600">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          onClick={getSuggestion}
          loading={loading}
          className="w-full mb-6"
        >
          <Shuffle size={18} />
          {loading ? 'Finding a recipe...' : 'Surprise me!'}
        </Button>

        {error && (
          <p className="text-sm text-center text-red-600 mb-4">{error}</p>
        )}

        {suggestion && (
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
            onClick={() => navigate(`/recipes/${suggestion.id}`)}
          >
            <div className="aspect-[16/9] bg-gray-100">
              <img
                src={getImageUrl(suggestion.coverImage)}
                alt={suggestion.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect fill="%23f3f4f6" width="400" height="225"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="48">🍽️</text></svg>';
                }}
              />
            </div>
            <div className="p-4">
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                {CATEGORY_LABELS[suggestion.category]}
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-2">{suggestion.title}</h2>
              {suggestion.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{suggestion.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {(suggestion.prepTime ?? 0) + (suggestion.cookTime ?? 0) > 0 && (
                  <span>⏱ {formatTime((suggestion.prepTime ?? 0) + (suggestion.cookTime ?? 0))}</span>
                )}
                <span>👥 {suggestion.servings}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium text-brand-600">View recipe</span>
                <ChevronRight size={16} className="text-brand-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
