import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import type { RecipeFormData, Category } from '@/types';
import { CATEGORY_LABELS } from '@/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { extractApiError } from '@/utils';
import { clsx } from 'clsx';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['STARTER', 'MAIN', 'DESSERT']),
  servings: z.coerce.number().int().min(1).max(100),
  prepTime: z.coerce.number().int().min(0).optional(),
  cookTime: z.coerce.number().int().min(0).optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        quantity: z.string().optional(),
        unit: z.string().optional(),
        order: z.number(),
      })
    )
    .min(1, 'Add at least one ingredient'),
  steps: z
    .array(z.object({ description: z.string().min(1, 'Step description is required'), order: z.number() }))
    .min(1, 'Add at least one step'),
  tagInput: z.string().optional(),
  tags: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: Category[] = ['STARTER', 'MAIN', 'DESSERT'];

interface RecipeFormPageProps {
  mode: 'create' | 'edit';
}

export function RecipeFormPage({ mode }: RecipeFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [apiError, setApiError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      servings: 4,
      ingredients: [{ name: '', quantity: '', unit: '', order: 0 }],
      steps: [{ description: '', order: 0 }],
      tags: [],
      category: 'MAIN',
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: 'steps',
  });

  const tags = watch('tags');

  // Load existing recipe for edit mode
  useEffect(() => {
    if (mode === 'edit' && id) {
      recipeApi.get(id).then((recipe) => {
        reset({
          title: recipe.title,
          description: recipe.description ?? '',
          category: recipe.category,
          servings: recipe.servings,
          prepTime: recipe.prepTime ?? undefined,
          cookTime: recipe.cookTime ?? undefined,
          ingredients: recipe.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity ?? '',
            unit: i.unit ?? '',
            order: i.order,
          })),
          steps: recipe.steps.map((s) => ({ description: s.description, order: s.order })),
          tags: recipe.tags.map((t) => t.name),
          tagInput: '',
        });
        if (recipe.coverImage) setImagePreview(recipe.coverImage);
      });
    }
  }, [mode, id, reset]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setValue('tags', [...tags, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setValue('tags', tags.filter((t) => t !== tag));
  }

  async function onSubmit(data: FormData) {
    setApiError('');
    try {
      const payload: RecipeFormData = {
        title: data.title,
        description: data.description,
        category: data.category,
        servings: data.servings,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        ingredients: data.ingredients.map((ing, i) => ({ ...ing, order: i })),
        steps: data.steps.map((step, i) => ({ ...step, order: i })),
        tags: data.tags,
      };

      let recipe;
      if (mode === 'create') {
        recipe = await recipeApi.create(payload);
      } else {
        recipe = await recipeApi.update(id!, payload);
      }

      // Upload image if selected
      if (imageFile) {
        await recipeApi.uploadImage(recipe.id, imageFile);
      }

      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      setApiError(extractApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:ml-60 pb-20 lg:pb-8">
      <div className="max-w-2xl mx-auto lg:px-0 lg:pt-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 lg:rounded-2xl lg:mb-4 lg:shadow-sm lg:border">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-gray-900 flex-1">
          {mode === 'create' ? 'New Recipe' : 'Edit Recipe'}
        </h1>
        <Button
          type="button"
          size="sm"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          Save
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pt-4 lg:px-0 lg:pt-0">
        {/* Image upload */}
        <div
          className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Upload size={32} />
              <p className="text-sm mt-2 font-medium">Tap to add cover photo</p>
              <p className="text-xs mt-0.5">JPEG, PNG or WebP, max 5 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
          <Input
            label="Title *"
            placeholder="e.g. Spaghetti Carbonara"
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label="Description"
            placeholder="A short description of this recipe..."
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Category *</label>
            <div className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const current = watch('category');
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={clsx(
                      'flex-1 py-2 rounded-xl text-sm font-medium border transition-colors',
                      current === cat
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    {CATEGORY_LABELS[cat].replace(' Courses', '')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servings & times */}
          <div className="grid grid-cols-3 gap-3">
            <Input label="Servings" type="number" min={1} {...register('servings')} />
            <Input label="Prep (min)" type="number" min={0} {...register('prepTime')} />
            <Input label="Cook (min)" type="number" min={0} {...register('cookTime')} />
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Ingredients *</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendIngredient({ name: '', quantity: '', unit: '', order: ingredientFields.length })}
            >
              <Plus size={14} />
              Add
            </Button>
          </div>
          {errors.ingredients?.root?.message && (
            <p className="text-xs text-red-600 mb-2">{errors.ingredients.root.message}</p>
          )}
          <div className="flex flex-col gap-3">
            {ingredientFields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="Name"
                      error={errors.ingredients?.[i]?.name?.message}
                      {...register(`ingredients.${i}.name`)}
                    />
                  </div>
                  <Input placeholder="Qty" {...register(`ingredients.${i}.quantity`)} />
                  <Input placeholder="Unit" {...register(`ingredients.${i}.unit`)} />
                  <button
                    type="button"
                    onClick={() => removeIngredient(i)}
                    className="flex items-center justify-center text-red-400 hover:text-red-600 mt-1"
                    disabled={ingredientFields.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Instructions *</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendStep({ description: '', order: stepFields.length })}
            >
              <Plus size={14} />
              Add step
            </Button>
          </div>
          {errors.steps?.root?.message && (
            <p className="text-xs text-red-600 mb-2">{errors.steps.root.message}</p>
          )}
          <div className="flex flex-col gap-3">
            {stepFields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2.5">
                  {i + 1}
                </span>
                <Textarea
                  rows={2}
                  placeholder={`Step ${i + 1}...`}
                  error={errors.steps?.[i]?.description?.message}
                  className="flex-1"
                  {...register(`steps.${i}.description`)}
                />
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="text-red-400 hover:text-red-600 mt-2.5"
                  disabled={stepFields.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Tags</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(); }
              }}
              placeholder="e.g. vegetarian, quick..."
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-brand-100"
                >
                  {tag}
                  <span className="text-brand-400">×</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {apiError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{apiError}</p>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          {mode === 'create' ? 'Create recipe' : 'Save changes'}
        </Button>
      </form>
      </div>
    </div>
  );
}
