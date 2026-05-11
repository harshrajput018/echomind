import axios from "axios";

const api = axios.create({ baseURL: "/api" });

const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : "/api";

console.log("API URL:", baseURL);

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("em_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("em_token");
      localStorage.removeItem("em_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
