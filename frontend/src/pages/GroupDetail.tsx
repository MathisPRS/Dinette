import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Copy, Check, Trash2, LogOut, Crown, Loader2, Plus,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useT } from '@/i18n';
import { useAuthStore } from '@/store/auth';
import { groupsApi } from '@/api/groups';
import { recipeApi } from '@/api/recipes';
import { extractApiError } from '@/utils';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Group, RecipeSummary } from '@/types';

export function GroupDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [group, setGroup] = useState<Group | null>(null);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!id) return;
    groupsApi.get(id)
      .then(setGroup)
      .catch(() => setError(t('error_generic')))
      .finally(() => setLoadingGroup(false));

    recipeApi.list({ groupId: id, limit: 50 })
      .then((res) => setRecipes(res.data))
      .catch(() => {})
      .finally(() => setLoadingRecipes(false));
  }, [id]);

  const handleFavoriteToggle = useCallback((recipeId: string, isFavorite: boolean) => {
    setRecipes((prev) =>
      prev.map((r) => r.id === recipeId ? { ...r, isFavorite } : r)
    );
  }, []);

  async function handleCopyCode() {
    if (!group) return;
    await navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!group) return;
    setLeaving(true);
    setActionError('');
    try {
      await groupsApi.leave(group.id);
      setConfirmLeave(false);
      navigate('/groups');
    } catch (err) {
      setActionError(extractApiError(err));
      setConfirmLeave(false);
      setLeaving(false);
    }
  }

  async function handleDelete() {
    if (!group) return;
    setDeleting(true);
    setActionError('');
    try {
      await groupsApi.delete(group.id);
      setConfirmDelete(false);
      navigate('/groups');
    } catch (err) {
      setActionError(extractApiError(err));
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  const isOwner = group?.ownerId === user?.id;

  if (loadingGroup) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 size={28} className="animate-spin text-brand-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !group) {
    return (
      <AppLayout>
        <div className="px-4 lg:px-0 pt-6 text-center text-gray-500">
          {error || t('error_generic')}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-4">
        {/* Back button */}
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('groups_back')}
        </button>

        {/* Group header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{group.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {t('groups_members', { count: group.members.length })}
              </p>
            </div>
            {isOwner ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title={t('recipe_delete')}
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                disabled={leaving}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title={t('groups_leave')}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Invite code (visible to all members) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('groups_invite_code')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-xl font-bold text-gray-900 tracking-widest bg-gray-50 rounded-xl px-4 py-2 text-center">
              {group.inviteCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              {copied ? (
                <><Check size={14} className="text-green-500" />{t('groups_invite_copied')}</>
              ) : (
                <><Copy size={14} />{t('groups_invite_copy')}</>
              )}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-3">{t('groups_members', { count: group.members.length })}</p>
          <div className="flex flex-col gap-2">
            {group.members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-700">
                    {m.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                </div>
                {m.userId === group.ownerId && (
                  <span className="flex items-center gap-1 text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                    <Crown size={10} />
                    {t('groups_you_owner')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recipes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Recettes</h2>
            <button
              onClick={() => navigate(`/recipes/new?groupId=${group.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Plus size={14} />
              {t('home_add_recipe')}
            </button>
          </div>

          {loadingRecipes ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-brand-600" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-500">{t('groups_recipes_empty')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('groups_recipes_empty_hint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action error */}
        {actionError && (
          <p className="text-sm text-red-600 text-center mt-2 mb-2">{actionError}</p>
        )}
      </div>

      <ConfirmModal
        open={confirmLeave}
        title={t('confirm_leave_group_title')}
        message={t('groups_leave_confirm')}
        confirmLabel={t('groups_leave')}
        cancelLabel={t('confirm_cancel')}
        variant="danger"
        loading={leaving}
        onConfirm={handleLeave}
        onCancel={() => setConfirmLeave(false)}
      />
      <ConfirmModal
        open={confirmDelete}
        title={t('confirm_delete_group_title')}
        message={t('confirm_delete_group_message')}
        confirmLabel={t('confirm_delete_group_confirm')}
        cancelLabel={t('confirm_cancel')}
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </AppLayout>
  );
}
