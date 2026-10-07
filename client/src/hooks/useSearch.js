import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { api, getErrorMessage } from "../lib/api.js";

// Fetches results for `q`. The input is already debounced, and each new query aborts the previous
// request so a slow old response can never overwrite a newer one.
export function useSearch(q) {
  const [state, setState] = useState({ loading: false, data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setState({ loading: false, data: null, error: null });
      return;
    }

    const controller = new AbortController();
    // Keep the previous results on screen (dimmed) while the next ones load, to avoid flicker.
    setState((s) => ({ ...s, loading: true, error: null }));

    api
      .get("/search", { params: { q: query, limit: 8 }, signal: controller.signal })
      .then((res) => setState({ loading: false, data: res.data.data, error: null }))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setState({ loading: false, data: null, error: getErrorMessage(err) });
      });

    return () => controller.abort();
  }, [q, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
