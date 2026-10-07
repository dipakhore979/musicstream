import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage } from "../lib/api.js";

const INITIAL = { items: [], page: 0, totalPages: 1, total: 0, loading: true, loadingMore: false, error: null };

// Loads page 1 on mount (and whenever url/params change), then appends more via loadMore().
export function usePaginatedList(url, params = {}, { limit = 20 } = {}) {
  const [state, setState] = useState(INITIAL);
  const requestId = useRef(0);
  const paramsKey = JSON.stringify(params);

  const load = useCallback(
    async (page) => {
      const id = ++requestId.current; // ignore responses from outdated requests
      setState((s) => ({ ...s, loading: page === 1, loadingMore: page > 1, error: null }));
      try {
        const { data } = await api.get(url, { params: { ...JSON.parse(paramsKey), page, limit } });
        if (id !== requestId.current) return;
        setState((s) => ({
          items: page === 1 ? data.data : [...s.items, ...data.data],
          page: data.meta.page,
          totalPages: data.meta.totalPages,
          total: data.meta.total,
          loading: false,
          loadingMore: false,
          error: null,
        }));
      } catch (err) {
        if (id !== requestId.current) return;
        setState((s) => ({ ...s, loading: false, loadingMore: false, error: getErrorMessage(err) }));
      }
    },
    [url, paramsKey, limit]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return {
    ...state,
    hasMore: state.page < state.totalPages,
    loadMore: () => load(state.page + 1),
    reload: () => load(1),
  };
}
