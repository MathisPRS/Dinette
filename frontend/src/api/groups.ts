import api from './client';
import type { Group } from '@/types';

export const groupsApi = {
  list: () =>
    api.get<{ groups: Group[] }>('/groups/mine').then((r) => r.data.groups),

  get: (id: string) =>
    api.get<{ group: Group }>(`/groups/${id}`).then((r) => r.data.group),

  create: (name: string) =>
    api.post<{ group: Group }>('/groups', { name }).then((r) => r.data.group),

  join: (inviteCode: string) =>
    api.post<{ group: Group }>('/groups/join', { inviteCode }).then((r) => r.data.group),

  leave: (id: string) =>
    api.delete(`/groups/${id}/leave`),

  delete: (id: string) =>
    api.delete(`/groups/${id}`),
};
