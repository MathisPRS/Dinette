import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn, ChevronRight, X, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useT } from '@/i18n';
import { groupsApi } from '@/api/groups';
import { extractApiError } from '@/utils';
import type { Group } from '@/types';

type Modal = 'create' | 'join' | null;

export function GroupsPage() {
  const t = useT();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    groupsApi.list()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function closeModal() {
    setModal(null);
    setCreateName('');
    setCreateError('');
    setJoinCode('');
    setJoinError('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const group = await groupsApi.create(createName.trim());
      setGroups((prev) => [group, ...prev]);
      closeModal();
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setCreateError(extractApiError(err));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError('');
    setJoinLoading(true);
    try {
      const group = await groupsApi.join(joinCode.trim().toUpperCase());
      setGroups((prev) => {
        if (prev.find((g) => g.id === group.id)) return prev;
        return [group, ...prev];
      });
      closeModal();
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setJoinError(extractApiError(err));
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="px-4 lg:px-0 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{t('groups_title')}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setModal('join')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogIn size={15} />
              {t('groups_join')}
            </button>
            <button
              onClick={() => setModal('create')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <Plus size={15} />
              {t('groups_create')}
            </button>
          </div>
        </div>

        {/* Group list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-brand-600" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">{t('groups_empty_title')}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{t('groups_empty_description')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 text-left hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <Users size={20} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {t('groups_members', { count: group.members.length })}
                    {' · '}
                    {group._count.recipes} recette{group._count.recipes !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl z-10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'create' ? t('groups_create_title') : t('groups_join_title')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {modal === 'create' ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('groups_create_name_label')}
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder={t('groups_create_name_placeholder')}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                {createError && <p className="text-xs text-red-500">{createError}</p>}
                <button
                  type="submit"
                  disabled={createLoading || !createName.trim()}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {createLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('groups_create_submit')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('groups_join_code_label')}
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder={t('groups_join_code_placeholder')}
                    required
                    maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                {joinError && <p className="text-xs text-red-500">{joinError}</p>}
                <button
                  type="submit"
                  disabled={joinLoading || joinCode.length < 6}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {joinLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('groups_join_submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
