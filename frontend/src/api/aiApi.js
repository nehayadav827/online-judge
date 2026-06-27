import axiosInstance from "./axiosInstance";

export const getCodeReview = (data) =>
  axiosInstance.post("/ai/review", data);

export const getComplexityAnalysis = (data) =>
  axiosInstance.post("/ai/complexity", data);

export const getHint = (data) =>
  axiosInstance.post("/ai/hint", data);

export const explainWrongAnswer = (data) =>
  axiosInstance.post("/ai/explain-wrong-answer", data);

export const explainError = (data) =>
  axiosInstance.post("/ai/explain-error", data);

export const generateTestCases = (data) =>
  axiosInstance.post("/ai/generate-test-cases", data);

export const getDryRun = (data) =>
  axiosInstance.post("/ai/dry-run", data);