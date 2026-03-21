import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Heart, Pencil, Trash2, Clock, Flame, Users,
  ChefHat, CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { recipeApi } from '@/api/recipes';
import { favoritesApi } from '@/api/favorites';
import { useAuthStore } from '@/store/auth';
import { useRecipeSheet } from '@/context/RecipeSheetContext';
import type { Recipe } from '@/types';
import { CATEGORY_LABELS, formatTime, getImageUrl, extractApiError } from '@/utils';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'ingredients' | 'steps';

export function RecipeSheet() {
  const { openRecipeId, closeSheet } = useRecipeSheet();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<Tab>('ingredients');

  // Track checked ingredients (UI only)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpen = openRecipeId !== null;

  // Load recipe when sheet opens
  useEffect(() => {
    if (!openRecipeId) {
      setRecipe(null);
      setError('');
      setTab('ingredients');
      setCheckedIngredients(new Set());
      return;
    }
    setLoading(true);
    setError('');
    recipeApi
      .get(openRecipeId)
      .then((r) => {
        setRecipe(r);
        setIsFavorite(r.isFavorite);
        // Scroll to top when new recipe loads
        scrollRef.current?.scrollTo({ top: 0 });
      })
      .catch(() => setError('Recette introuvable'))
      .finally(() => setLoading(false));
  }, [openRecipeId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSheet();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeSheet]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function toggleFavorite() {
    if (!isAuthenticated) { navigate('/login'); closeSheet(); return; }
    setFavLoading(true);
    try {
      if (isFavorite) {
        await favoritesApi.remove(openRecipeId!);
        setIsFavorite(false);
      } else {
        await favoritesApi.add(openRecipeId!);
        setIsFavorite(true);
      }
    } finally {
      setFavLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette recette ? Cette action est irréversible.')) return;
    setDeleting(true);
    try {
      await recipeApi.delete(openRecipeId!);
      closeSheet();
      navigate('/');
    } catch (err) {
      alert(extractApiError(err));
      setDeleting(false);
    }
  }

  function handleEdit() {
    closeSheet();
    navigate(`/recipes/${openRecipeId}/edit`);
  }

  function toggleIngredient(id: string) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const isOwner = recipe && user?.id === recipe.author.id;
  const totalTime = recipe ? (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0) : 0;

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────── */}
      <div
        className={clsx(
          'fixed inset-0 z-50 transition-all duration-300',
          isOpen
            ? 'bg-black/50 backdrop-blur-sm pointer-events-auto'
            : 'bg-black/0 backdrop-blur-none pointer-events-none'
        )}
        onClick={closeSheet}
        aria-hidden="true"
      />

      {/* ── Sheet panel ─────────────────────────────── */}
      {/*
        Desktop : glisse depuis la droite (translate-x)
        Mobile  : monte depuis le bas (translate-y), 90vh, coins arrondis en haut
      */}
      <div
        className={clsx(
          'fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-out',
          // Desktop : panneau latéral droit
          'lg:inset-y-0 lg:right-0 lg:w-[580px] lg:rounded-none',
          // Mobile : bottom sheet
          'inset-x-0 bottom-0 rounded-t-3xl max-h-[92vh]',
          isOpen
            ? 'translate-x-0 translate-y-0'
            : 'lg:translate-x-full translate-y-full'
        )}
      >
        {/* Drag handle (mobile) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Content — scrollable */}
        <div
          ref={scrollRef}
          className="overflow-y-auto h-full pb-safe"
          style={{ maxHeight: 'calc(92vh - 20px)' }}
        >
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6">
              <p className="text-gray-500 text-center">{error}</p>
              <button
                onClick={closeSheet}
                className="text-sm text-brand-600 font-medium"
              >
                Fermer
              </button>
            </div>
          )}

          {!loading && !error && recipe && (
            <>
              {/* ── Hero image ───────────────────────── */}
              <div className="relative aspect-[16/9] bg-gray-100 flex-shrink-0">
                <img
                  src={getImageUrl(recipe.coverImage)}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="580" height="326" viewBox="0 0 580 326"><rect fill="%23f3f4f6" width="580" height="326"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="72">🍽️</text></svg>';
                  }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Close button */}
                <button
                  onClick={closeSheet}
                  className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>

                {/* Action buttons top-right */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className={clsx(
                      'w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors',
                      isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    )}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  {isOwner && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Category badge bottom-left */}
                <div className="absolute bottom-3 left-4">
                  <span className="text-xs font-semibold text-white bg-brand-600 px-2.5 py-1 rounded-full">
                    {CATEGORY_LABELS[recipe.category]}
                  </span>
                </div>
              </div>

              {/* ── Body ─────────────────────────────── */}
              <div className="px-5 pt-4 pb-8">

                {/* Title + description */}
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {recipe.title}
                </h2>
                {recipe.description && (
                  <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                    {recipe.description}
                  </p>
                )}

                {/* Tags */}
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {recipe.prepTime != null && recipe.prepTime > 0 && (
                    <StatCard
                      icon={<Clock size={18} className="text-blue-500" />}
                      label="Préparation"
                      value={formatTime(recipe.prepTime)}
                    />
                  )}
                  {recipe.cookTime != null && recipe.cookTime > 0 && (
                    <StatCard
                      icon={<Flame size={18} className="text-orange-500" />}
                      label="Cuisson"
                      value={formatTime(recipe.cookTime)}
                    />
                  )}
                  <StatCard
                    icon={<Users size={18} className="text-green-500" />}
                    label="Portions"
                    value={String(recipe.servings)}
                  />
                  {totalTime > 0 && (
                    <StatCard
                      icon={<ChefHat size={18} className="text-purple-500" />}
                      label="Total"
                      value={formatTime(totalTime)}
                    />
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100 mt-5" />

                {/* Tabs */}
                <div className="flex gap-1 mt-4 p-1 bg-gray-100 rounded-xl">
                  <TabButton
                    active={tab === 'ingredients'}
                    onClick={() => setTab('ingredients')}
                    label={`Ingrédients (${recipe.ingredients.length})`}
                  />
                  <TabButton
                    active={tab === 'steps'}
                    onClick={() => setTab('steps')}
                    label={`Instructions (${recipe.steps.length})`}
                  />
                </div>

                {/* ── Ingrédients ──────────────────── */}
                {tab === 'ingredients' && (
                  <div className="mt-4 flex flex-col gap-1">
                    {recipe.ingredients.map((ing) => {
                      const checked = checkedIngredients.has(ing.id);
                      return (
                        <button
                          key={ing.id}
                          onClick={() => toggleIngredient(ing.id)}
                          className={clsx(
                            'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors',
                            checked
                              ? 'bg-brand-50 text-gray-400'
                              : 'hover:bg-gray-50 text-gray-800'
                          )}
                        >
                          <span className={clsx(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                            checked ? 'bg-brand-600 border-brand-600' : 'border-gray-300'
                          )}>
                            {checked && <CheckCircle2 size={14} className="text-white" strokeWidth={2.5} />}
                          </span>
                          <span className={clsx('flex-1 text-sm font-medium', checked && 'line-through')}>
                            {ing.name}
                          </span>
                          {(ing.quantity || ing.unit) && (
                            <span className={clsx('text-sm flex-shrink-0', checked ? 'text-gray-300' : 'text-gray-400')}>
                              {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {checkedIngredients.size > 0 && (
                      <button
                        onClick={() => setCheckedIngredients(new Set())}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 self-start ml-3"
                      >
                        Tout décocher
                      </button>
                    )}
                  </div>
                )}

                {/* ── Instructions ─────────────────── */}
                {tab === 'steps' && (
                  <ol className="mt-4 flex flex-col gap-4">
                    {recipe.steps.map((step, i) => (
                      <li key={step.id} className="flex gap-3">
                        <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {/* Author */}
                <p className="mt-6 text-xs text-gray-400 text-center">
                  Recette de <span className="font-medium text-gray-500">{recipe.author.name}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-2.5 text-center">
      {icon}
      <span className="text-sm font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-[10px] text-gray-400 leading-none">{label}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {label}
    </button>
  );
}
