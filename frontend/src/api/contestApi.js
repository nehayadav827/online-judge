import axiosInstance from "./axiosInstance";

export const getAllContests = (params) =>
  axiosInstance.get("/contests", { params });

export const getContestBySlug = (slug) =>
  axiosInstance.get(`/contests/${slug}`);

export const registerForContest = (slug) =>
  axiosInstance.post(`/contests/${slug}/register`);

export const contestSubmit = (slug, data) =>
  axiosInstance.post(`/contests/${slug}/submit`, data);

export const getScoreboard = (slug) =>
  axiosInstance.get(`/contests/${slug}/scoreboard`);

export const getMyContestSubmissions = (slug) =>
  axiosInstance.get(`/contests/${slug}/my-submissions`);