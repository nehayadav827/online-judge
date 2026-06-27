import axiosInstance from "./axiosInstance";

export const getMyDashboard = () =>
  axiosInstance.get("/dashboard/me");

export const getLeaderboard = (limit = 20) =>
  axiosInstance.get("/dashboard/leaderboard", { params: { limit } });