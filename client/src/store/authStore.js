import { create } from "zustand";
import { api } from "../lib/api.js";

export const useAuthStore = create((set) => ({
  user: null,
  initialized: false, // false until the first /auth/me check finishes, so we don't flash the login page

  // Restores the session on page load using the httpOnly cookie.
  initialize: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },

  // Signup does NOT log you in. It emails a code, and verifying that code does.
  signup: async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    return data.data; // { email, requiresVerification }
  },

  verifyEmail: async (payload) => {
    const { data } = await api.post("/auth/verify-email", payload);
    set({ user: data.data });
    return data.data;
  },

  login: async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    set({ user: data.data });
    return data.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      set({ user: null });
    }
  },

  setUser: (user) => set({ user }),
}));

// Fired by the axios interceptor when any request comes back 401.
window.addEventListener("auth:expired", () => useAuthStore.setState({ user: null }));
