import { create } from "zustand";
import { api } from "../lib/api.js";

// A copy of the signed-in user's profile (never a token) so the app can still open with no internet
// and reach the songs downloaded inside the app. The real session stays in the httpOnly cookie.
const CACHE_KEY = "musicstream-user";
const remember = (user) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable: offline start-up just won't work */
  }
};
const recall = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
};
const forget = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  initialized: false, // false until the first /auth/me check finishes, so we don't flash the login page

  // Restores the session on page load using the httpOnly cookie.
  initialize: async () => {
    try {
      const { data } = await api.get("/auth/me");
      remember(data.data);
      set({ user: data.data, initialized: true });
    } catch (err) {
      if (err.response) {
        // The server answered "no": the session is really gone.
        forget();
        set({ user: null, initialized: true });
      } else {
        // No answer at all means the network is down, not that the session is invalid:
        // stay signed in locally so downloaded songs remain reachable.
        set({ user: recall(), initialized: true });
      }
    }
  },

  // Signup does NOT log you in. It emails a code, and verifying that code does.
  signup: async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    return data.data; // { email, requiresVerification }
  },

  verifyEmail: async (payload) => {
    const { data } = await api.post("/auth/verify-email", payload);
    remember(data.data);
    set({ user: data.data });
    return data.data;
  },

  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    remember(data.data);
    set({ user: data.data });
    return data.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      forget();
      set({ user: null });
    }
  },

  setUser: (user) => {
    remember(user);
    set({ user });
  },
}));

// Fired by the axios interceptor when any request comes back 401.
window.addEventListener("auth:expired", () => {
  forget();
  useAuthStore.setState({ user: null });
});
