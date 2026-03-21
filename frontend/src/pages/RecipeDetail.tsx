import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Clock, Users, Pencil, Trash2 } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import { favoritesApi } from '@/api/favorites';
import { useAuthStore } from '@/store/auth';
import type { Recipe } from '@/types';
import { CATEGORY_LABELS, formatTime, getImageUrl, extractApiError } from '@/utils';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    recipeApi
      .get(id)
      .then((r) => {
        setRecipe(r);
        setIsFavorite(r.isFavorite);
      })
      .catch(() => setError('Recipe not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleFavorite() {
    if (!isAuthenticated) { navigate('/login'); return; }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoritesApi.remove(id!);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(id!);
        setIsFavorite(true);
      }
    } finally {
      setFavLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await recipeApi.delete(id!);
      navigate('/');
    } catch (err) {
      alert(extractApiError(err));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen lg:ml-60">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 lg:ml-60">
        <p className="text-gray-500">{error || 'Something went wrong'}</p>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  const isOwner = user?.id === recipe.author.id;
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-60">
      <div className="max-w-4xl mx-auto pb-20 lg:pb-8 lg:px-6 lg:pt-6">

        {/* Back button row — desktop only (mobile uses image overlay) */}
        <div className="hidden lg:flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Desktop: two-column. Mobile: stacked. */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">

          {/* Left column — image + owner actions */}
          <div className="lg:col-span-2">
            {/* Hero image */}
            <div className="relative aspect-[4/3] bg-gray-200 lg:rounded-2xl overflow-hidden">
              <img
                src={getImageUrl(recipe.coverImage)}
                alt={recipe.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="64">🍽️</text></svg>';
                }}
              />
              {/* Mobile top bar (back + favorite) */}
              <div className="lg:hidden absolute top-0 left-0 right-0 flex items-center justify-between p-4">
                <button
                  onClick={() => navigate(-1)}
                  className="w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={toggleFavorite}
                  disabled={favLoading}
                  className={clsx(
                    'w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm',
                    isFavorite ? 'text-red-500' : 'text-gray-500'
                  )}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Ingredients (shown in left column on desktop) */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4">
              <h2 className="font-semibold text-gray-900 mb-3">Ingredients</h2>
              <ul className="flex flex-col gap-2">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                    <span className="text-gray-900">{ing.name}</span>
                    {(ing.quantity || ing.unit) && (
                      <span className="text-gray-500 ml-auto flex-shrink-0">
                        {ing.quantity} {ing.unit}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column — all recipe info */}
          <div className="lg:col-span-3">
            <div className="px-4 lg:px-0 -mt-6 lg:mt-0 relative">

              {/* Card header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[recipe.category]}
                    </span>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mt-2 leading-tight">{recipe.title}</h1>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                    )}
                  </div>
                  {/* Desktop favorite button */}
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className={clsx(
                      'hidden lg:flex w-9 h-9 rounded-full items-center justify-center border transition-colors',
                      isFavorite
                        ? 'text-red-500 border-red-200 bg-red-50'
                        : 'text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-400'
                    )}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{recipe.servings} servings</span>
                  </div>
                  {recipe.prepTime && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Prep {formatTime(recipe.prepTime)}</span>
                    </div>
                  )}
                  {recipe.cookTime && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Cook {formatTime(recipe.cookTime)}</span>
                    </div>
                  )}
                  {totalTime > 0 && (
                    <div className="flex items-center gap-1 font-medium text-brand-600">
                      <Clock size={14} />
                      <span>{formatTime(totalTime)} total</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/recipes/${id}/edit`)}
                      className="flex-1"
                    >
                      <Pencil size={14} />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      loading={deleting}
                      className="flex-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {/* Ingredients (mobile only — shown in right column stacked view) */}
              <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                <h2 className="font-semibold text-gray-900 mb-3">Ingredients</h2>
                <ul className="flex flex-col gap-2">
                  {recipe.ingredients.map((ing) => (
                    <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                      <span className="text-gray-900">{ing.name}</span>
                      {(ing.quantity || ing.unit) && (
                        <span className="text-gray-500 ml-auto flex-shrink-0">
                          {ing.quantity} {ing.unit}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h2 className="font-semibold text-gray-900 mb-3">Instructions</h2>
                <ol className="flex flex-col gap-4">
                  {recipe.steps.map((step, i) => (
                    <li key={step.id} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>
                    </li>
                  ))}
                </ol>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
