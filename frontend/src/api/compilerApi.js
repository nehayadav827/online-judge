import axiosInstance from "./axiosInstance";

export const runCode = (data) =>
  axiosInstance.post("/compiler/run", data);