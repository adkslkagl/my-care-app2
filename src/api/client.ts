import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('no refresh token');

        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });

        const newAccessToken = res.data.accessToken;
        await SecureStore.setItemAsync('accessToken', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch (e) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
