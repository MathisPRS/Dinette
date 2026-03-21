import api from './client';
import type { Tag } from '@/types';

export const tagsApi = {
  list: () =>
    api
      .get<{ data: (Tag & { _count: { recipes: number } })[] }>('/tags')
      .then((r) => r.data.data),
};
