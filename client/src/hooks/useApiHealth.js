import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../lib/api.js";

export function useApiHealth() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get("/health")
      .then((res) => !cancelled && setState({ loading: false, data: res.data.data, error: null }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: getErrorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
