import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Category } from '@/types';
import { CATEGORY_LABELS } from '@/utils';

interface RecipeFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeCategory: Category | undefined;
  onCategoryChange: (category: Category | undefined) => void;
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
}

const categories: Category[] = ['STARTER', 'MAIN', 'DESSERT'];

export function RecipeFiltersBar({
  search,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  activeTags,
  onTagToggle,
  availableTags,
}: RecipeFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => onCategoryChange(undefined)}
          className={clsx(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            !activeCategory
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(activeCategory === cat ? undefined : cat)}
            className={clsx(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Tag chips */}
      {availableTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={clsx(
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors',
                activeTags.includes(tag)
                  ? 'bg-brand-100 text-brand-700 border border-brand-300'
                  : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
