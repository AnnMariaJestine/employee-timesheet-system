import axios from "axios";

// While developing on your laptop, the backend runs at this address.
// When we deploy to Azure later, we'll change this to the live backend URL.
const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({ baseURL: API_BASE_URL });

// Before every request, attach the saved login token (if we have one),
// so the backend knows who's asking.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
