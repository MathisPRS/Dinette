import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Upload, Camera } from 'lucide-react';
import { recipeApi } from '@/api/recipes';
import { groupsApi } from '@/api/groups';
import type { RecipeFormData, Category, Group } from '@/types';
import { useCategoryLabels, extractApiError } from '@/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { clsx } from 'clsx';
import { useT } from '@/i18n';

const CATEGORIES: Category[] = ['STARTER', 'MAIN', 'DESSERT'];

interface RecipeFormPageProps {
  mode: 'create' | 'edit';
}

export function RecipeFormPage({ mode }: RecipeFormPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    searchParams.get('groupId')
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const categoryLabels = useCategoryLabels();

  // Load user's groups for the group selector
  useEffect(() => {
    groupsApi.list().then(setGroups).catch(() => {});
  }, []);

  const schema = z.object({
    title: z.string().min(1, t('validation_title_required')).max(200),
    description: z.string().max(2000).optional(),
    category: z.enum(['STARTER', 'MAIN', 'DESSERT']),
    servings: z.coerce.number().int().min(1).max(100),
    prepTime: z.coerce.number().int().min(0).optional(),
    cookTime: z.coerce.number().int().min(0).optional(),
    ingredients: z
      .array(
        z.object({
          name: z.string().min(1, t('validation_ingredient_name_required')),
          quantity: z.string().optional(),
          unit: z.string().optional(),
          order: z.number(),
        })
      )
      .min(1, t('validation_add_ingredient')),
    steps: z
      .array(z.object({ description: z.string().min(1, t('validation_step_required')), order: z.number() }))
      .min(1, t('validation_add_step')),
    tagInput: z.string().optional(),
    tags: z.array(z.string()),
  });

  type FormData = z.infer<typeof schema>;

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
          tags: recipe.tags.map((tg) => tg.name),
          tagInput: '',
        });
        if (recipe.coverImage) setImagePreview(recipe.coverImage);
        if (recipe.groupId) setSelectedGroupId(recipe.groupId);
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
    setValue('tags', tags.filter((tg) => tg !== tag));
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
        groupId: selectedGroupId ?? null,
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
    <div className="min-h-screen bg-gray-50 lg:ml-60 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
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
          {mode === 'create' ? t('form_create_title') : t('form_edit_title')}
        </h1>
        <Button
          type="button"
          size="sm"
          loading={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {t('form_save')}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pt-4 lg:px-0 lg:pt-0">
        {/* Image upload */}
        <div className="flex flex-col gap-2">
          <div
            className="relative aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Upload size={32} />
                <p className="text-sm mt-2 font-medium">{t('form_cover_photo')}</p>
                <p className="text-xs mt-0.5">{t('form_cover_hint')}</p>
              </div>
            )}
          </div>

          {/* Photo action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} />
              {t('form_cover_gallery')}
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Camera size={16} />
              {t('form_cover_camera')}
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
          <Input
            label={t('form_title_label')}
            placeholder={t('form_title_placeholder')}
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label={t('form_description_label')}
            placeholder={t('form_description_placeholder')}
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('form_category_label')}</label>
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
                    {categoryLabels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servings & times */}
          <div className="grid grid-cols-3 gap-3">
            <Input label={t('form_servings')} type="number" min={1} {...register('servings')} />
            <Input label={t('form_prep_time')} type="number" min={0} {...register('prepTime')} />
            <Input label={t('form_cook_time')} type="number" min={0} {...register('cookTime')} />
          </div>
        </div>

        {/* Ingredients */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">{t('form_ingredients_title')}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendIngredient({ name: '', quantity: '', unit: '', order: ingredientFields.length })}
            >
              <Plus size={14} />
              {t('form_add')}
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
                      placeholder={t('form_ingredient_name')}
                      error={errors.ingredients?.[i]?.name?.message}
                      {...register(`ingredients.${i}.name`)}
                    />
                  </div>
                  <Input placeholder={t('form_ingredient_qty')} {...register(`ingredients.${i}.quantity`)} />
                  <Input placeholder={t('form_ingredient_unit')} {...register(`ingredients.${i}.unit`)} />
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
            <h2 className="font-semibold text-gray-900">{t('form_steps_title')}</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendStep({ description: '', order: stepFields.length })}
            >
              <Plus size={14} />
              {t('form_add_step')}
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
                  placeholder={t('form_step_placeholder', { n: i + 1 })}
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

        {/* Group selector */}
        {groups.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t('form_group_label')}
            </label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left',
                  selectedGroupId === null
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {t('form_group_none')}
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGroupId(g.id)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left',
                    selectedGroupId === g.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">{t('form_tags_title')}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(); }
              }}
              placeholder={t('form_tag_placeholder')}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              {t('form_add')}
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
          {mode === 'create' ? t('form_create_submit') : t('form_edit_submit')}
        </Button>
      </form>
      </div>
    </div>
  );
}
