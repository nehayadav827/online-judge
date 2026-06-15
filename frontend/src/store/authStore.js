import { create } from "zustand";
import axiosInstance from "../api/axiosInstance";

export const useAuthStore = create(
  (set) => ({
    user: null,
    accessToken: null,
    loading: true,

    setAuth: (
      user,
      accessToken
    ) =>
      set({
        user,
        accessToken,
        loading: false,
      }),

    clearAuth: () =>
      set({
        user: null,
        accessToken: null,
        loading: false,
      }),

    initAuth: async () => {
      try {
        const refreshRes =
          await axiosInstance.post(
            "/auth/refresh"
          );

        const accessToken =
          refreshRes.data.accessToken;

        set({
          accessToken,
        });

        const meRes =
          await axiosInstance.get(
            "/auth/me"
          );

        set({
          user: meRes.data.user,
          loading: false,
        });

      } catch (error) {
        set({
          user: null,
          accessToken: null,
          loading: false,
        });
      }
    },
  })
);