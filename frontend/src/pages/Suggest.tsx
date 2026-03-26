import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ExternalLink, Youtube, ChevronDown } from 'lucide-react';
import { suggestApi, type MealIngredient } from '@/api/suggest';
import { recipeApi } from '@/api/recipes';
import type { ExternalRecipe, Category, RecipeFormData } from '@/types';
import { extractApiError } from '@/utils';
import { Button } from '@/components/ui/Button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useT } from '@/i18n';
import { useI18nStore } from '@/i18n';

// ── Category mapping ──────────────────────────────────────────────────────────

function mapCategory(mealdbCategory: string): Category {
  const lower = mealdbCategory.toLowerCase();
  if (lower === 'dessert' || lower === 'desserts') return 'DESSERT';
  if (lower === 'starter' || lower === 'starters' || lower === 'soup' || lower === 'side')
    return 'STARTER';
  return 'MAIN';
}

// ── Ingredient Combobox ───────────────────────────────────────────────────────

interface IngredientComboboxProps {
  ingredients: MealIngredient[];
  loading: boolean;
  locale: string;
  value: MealIngredient | null;
  onChange: (ing: MealIngredient | null) => void;
}

function IngredientCombobox({ ingredients, loading, locale, value, onChange }: IngredientComboboxProps) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter + sort suggestions: exact/prefix matches first, then partial matches
  const suggestions = query.trim().length === 0
    ? []
    : (() => {
        const q = query.toLowerCase();
        const displayName = (ing: MealIngredient) =>
          (locale === 'fr' ? ing.nameFr : ing.nameEn).toLowerCase();

        const matched = ingredients.filter((ing) =>
          ing.nameEn.toLowerCase().includes(q) ||
          ing.nameFr.toLowerCase().includes(q)
        );

        // Score: 0 = exact match, 1 = starts with query, 2 = word boundary match, 3 = substring
        const score = (ing: MealIngredient) => {
          const name = displayName(ing);
          if (name === q) return 0;
          if (name.startsWith(q)) return 1;
          if (name.split(/\s+/).some((w) => w.startsWith(q))) return 2;
          return 3;
        };

        return matched.sort((a, b) => score(a) - score(b)).slice(0, 8);
      })();

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    onChange(null); // clear selection on new typing
    setOpen(true);
  }

  function handleSelect(ing: MealIngredient) {
    onChange(ing);
    setQuery('');
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const inputValue = value ? (locale === 'fr' ? value.nameFr : value.nameEn) : query;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {t('suggest_ext_ingredient_label')}
      </label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { if (!value && query.length > 0) setOpen(true); }}
          placeholder={
            loading
              ? t('suggest_ext_ingredient_loading')
              : t('suggest_ext_ingredient_placeholder')
          }
          disabled={loading}
          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
        {(value || query) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.trim().length > 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">{t('suggest_ext_ingredient_no_match')}</p>
          ) : (
            suggestions.map((ing) => (
              <button
                key={ing.nameEn}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between"
                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(ing)}
              >
                <span className="font-medium">
                  {locale === 'fr' ? ing.nameFr : ing.nameEn}
                </span>
                {locale === 'fr' && (
                  <span className="text-xs text-gray-400 ml-2">{ing.nameEn}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected badge */}
      {value && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            {locale === 'fr' ? value.nameFr : value.nameEn}
            <button onClick={handleClear} type="button" className="ml-0.5 hover:text-brand-900">
              <X size={11} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Recipe Card ───────────────────────────────────────────────────────────────

interface RecipeCardProps {
  meal: ExternalRecipe;
  translatedTitle?: string;
  onClick: () => void;
}

function RecipeCard({ meal, translatedTitle, onClick }: RecipeCardProps) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md active:scale-95 transition-all"
      onClick={onClick}
    >
      <div className="aspect-[16/9] bg-gray-100">
        <img
          src={meal.image}
          alt={meal.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect fill="%23f3f4f6" width="400" height="225"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="48">🍽️</text></svg>';
          }}
        />
      </div>
      <div className="p-3">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {meal.category && (
            <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
              {meal.category}
            </span>
          )}
          {meal.area && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {meal.area}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {translatedTitle ?? meal.title}
        </h3>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  mealId: string;
  locale: string;
  onClose: () => void;
  onImported: (recipeId: string) => void;
}

function DetailModal({ mealId, locale, onClose, onImported }: DetailModalProps) {
  const t = useT();
  const [importState, setImportState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  // Fetch detail with translation server-side
  const [meal, setMeal] = useState<ExternalRecipe | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useEffect(() => {
    setLoadingDetail(true);
    suggestApi
      .detail(mealId, locale)
      .then(setMeal)
      .catch(() => { /* keep null */ })
      .finally(() => setLoadingDetail(false));
  }, [mealId, locale]);

  async function handleImport() {
    if (!meal) return;
    setImportState('loading');
    setImportError('');
    try {
      const data: RecipeFormData = {
        title: meal.title,
        coverImage: meal.image ?? null,
        category: mapCategory(meal.category),
        servings: 4,
        ingredients: meal.ingredients.map((ing, i) => ({
          name: ing.name,
          quantity: ing.measure || undefined,
          order: i,
        })),
        steps: meal.steps.map((s, i) => ({ description: s, order: i })),
        tags: meal.tags,
      };
      const created = await recipeApi.create(data);
      setImportState('done');
      setTimeout(() => onImported(created.id), 1000);
    } catch (err) {
      setImportState('error');
      setImportError(extractApiError(err));
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const displaySteps = meal?.steps ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl sm:mx-4 max-h-[90vh] flex flex-col rounded-t-2xl overflow-hidden">
        {/* Header image */}
        <div className="relative aspect-[16/7] flex-shrink-0 bg-gray-100">
          {meal && (
            <img
              src={meal.image}
              alt={meal.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280"><rect fill="%23f3f4f6" width="640" height="280"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="64">🍽️</text></svg>';
              }}
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
            aria-label={t('suggest_ext_close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5">
          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <span className="text-sm text-gray-400 italic">{t('suggest_ext_translating')}</span>
            </div>
          ) : !meal ? (
            <p className="text-center text-sm text-red-500 py-10">{t('suggest_ext_no_results')}</p>
          ) : (
            <>
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {meal.category && (
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                    {meal.category}
                  </span>
                )}
                {meal.area && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {meal.area}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {meal.title}
              </h2>

              {/* External links */}
              <div className="flex gap-2 mb-5">
                {meal.youtube && (
                  <a
                    href={meal.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Youtube size={14} />
                    {t('suggest_ext_watch_youtube')}
                  </a>
                )}
                {meal.source && (
                  <a
                    href={meal.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ExternalLink size={14} />
                    {t('suggest_ext_view_source')}
                  </a>
                )}
              </div>

              {/* Ingredients — translated server-side */}
              {meal.ingredients.length > 0 && (
                <section className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('suggest_ext_ingredients_title')}
                  </h3>
                  <ul className="space-y-1">
                    {meal.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-baseline gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0 mt-1.5" />
                        <span className="text-gray-900 font-medium">{ing.name}</span>
                        {ing.measure && (
                          <span className="text-gray-500 ml-auto text-xs">{ing.measure}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Steps — translated server-side */}
              {displaySteps.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {t('suggest_ext_steps_title')}
                  </h3>
                  <ol className="space-y-3">
                    {displaySteps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-gray-700 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>

        {/* Import footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          {importState === 'error' && (
            <p className="text-xs text-red-600 mb-2 text-center">{importError}</p>
          )}
          <Button
            size="lg"
            className="w-full"
            loading={importState === 'loading' || loadingDetail}
            disabled={importState === 'done' || !meal}
            onClick={handleImport}
          >
            {importState === 'done'
              ? t('suggest_ext_imported')
              : importState === 'loading'
                ? t('suggest_ext_importing')
                : t('suggest_ext_import_btn')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SuggestPage() {
  const navigate = useNavigate();
  const t = useT();
  const locale = useI18nStore((s) => s.locale);

  // Ingredient list from DB
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<MealIngredient | null>(null);

  // Filter dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Results
  const [results, setResults] = useState<ExternalRecipe[] | null>(null);
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  // UI state
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Load ingredients + categories + areas on mount
  useEffect(() => {
    setIngredientsLoading(true);
    setLoadingMeta(true);

    Promise.all([
      suggestApi.ingredients(),
      suggestApi.categories(),
      suggestApi.areas(),
    ])
      .then(([ings, cats, ars]) => {
        setIngredients(ings);
        setCategories(cats);
        setAreas(ars);
      })
      .catch(() => {/* non-blocking */})
      .finally(() => {
        setIngredientsLoading(false);
        setLoadingMeta(false);
      });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedIngredient) return;
    setSearching(true);
    setSearchError('');
    setResults(null);
    setTranslatedTitles({});

    try {
      const meals = await suggestApi.search({
        ingredient: selectedIngredient.nameEn,
        category: selectedCategory || undefined,
        area: selectedArea || undefined,
      });
      setResults(meals);

      // Async translation of titles if locale is FR
      if (locale === 'fr' && meals.length > 0) {
        suggestApi
          .translate(meals.map((m) => m.title))
          .then((translated) => {
            const map: Record<string, string> = {};
            meals.forEach((m, i) => {
              if (translated[i]) map[m.id] = translated[i];
            });
            setTranslatedTitles(map);
          })
          .catch(() => {/* keep originals */});
      }
    } catch (err) {
      setSearchError(extractApiError(err));
    } finally {
      setSearching(false);
    }
  }, [selectedIngredient, selectedCategory, selectedArea, locale]);

  function handleImported(recipeId: string) {
    setSelectedMealId(null);
    navigate(`/recipes/${recipeId}`);
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-6 max-w-2xl mx-auto pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('suggest_ext_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('suggest_ext_subtitle')}</p>
        </div>

        {/* Search form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
          {/* Ingredient combobox */}
          <div className="mb-3">
            <IngredientCombobox
              ingredients={ingredients}
              loading={ingredientsLoading}
              locale={locale}
              value={selectedIngredient}
              onChange={setSelectedIngredient}
            />
          </div>

          {/* Filters */}
          {!loadingMeta && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('suggest_ext_category_label')}
                </label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">{t('suggest_ext_all_categories')}</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t('suggest_ext_area_label')}
                </label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">{t('suggest_ext_all_areas')}</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <Button
            size="md"
            className="w-full"
            onClick={handleSearch}
            loading={searching}
            disabled={!selectedIngredient}
          >
            <Search size={16} />
            {searching ? t('suggest_ext_searching') : t('suggest_ext_search_btn')}
          </Button>
        </div>

        {/* Hint */}
        {results === null && !searching && !searchError && (
          <p className="text-center text-sm text-gray-400 mt-8">{t('suggest_ext_hint')}</p>
        )}

        {/* Error */}
        {searchError && (
          <p className="text-center text-sm text-red-600 mt-4">{searchError}</p>
        )}

        {/* Results */}
        {results !== null && (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {t('suggest_ext_results_count').replace('{count}', String(results.length))}
            </p>

            {results.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-6">{t('suggest_ext_no_results')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {results.map((meal) => (
                  <RecipeCard
                    key={meal.id}
                    meal={meal}
                    translatedTitle={translatedTitles[meal.id]}
                    onClick={() => setSelectedMealId(meal.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail modal */}
      {selectedMealId && (
        <DetailModal
          mealId={selectedMealId}
          locale={locale}
          onClose={() => setSelectedMealId(null)}
          onImported={handleImported}
        />
      )}
    </AppLayout>
  );
}
