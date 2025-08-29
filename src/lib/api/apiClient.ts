import axios from "axios";
import { getApiBaseUrl, getApiRefreshUrl } from "../config/env";

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Request interceptor to add JWT token
axiosClient.interceptors.request.use(
  function (request) {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      request.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return request;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosClient.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(getApiRefreshUrl(), {}, {
          withCredentials: true // Include cookies for refresh token
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
