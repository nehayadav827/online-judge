import { create } from "zustand";
import axiosInstance from "../api/axiosInstance";

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  loading: true,

  setAuth: (user, accessToken) => set({ user, accessToken, loading: false }),

  clearAuth: () => set({ user: null, accessToken: null, loading: false }),

  // Helper — always read role from server-fetched user object
  // Never from localStorage or manually set state
  isAdmin: () => {
    const user = get().user;
    return user?.role === "admin" || user?.role === "problemsetter";
  },

  initAuth: async () => {
    try {
      const refreshRes = await axiosInstance.post("/auth/refresh", {}, {
        withCredentials: true,
      });

      const accessToken = refreshRes.data.accessToken;
      set({ accessToken });

      // Always fetch fresh user from server — includes real role
      const meRes = await axiosInstance.get("/auth/me");
      set({ user: meRes.data.user, loading: false });

    } catch {
      set({ user: null, accessToken: null, loading: false });
    }
  },
}));