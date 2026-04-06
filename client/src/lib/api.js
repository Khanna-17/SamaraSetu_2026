import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = localStorage.getItem("arena_user_token");
  const adminToken = localStorage.getItem("arena_admin_token");
  const adminFlag = config.headers["X-Admin"] || config.headers["x-admin"];
  const authToken = adminFlag ? adminToken : token;

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

export default api;
