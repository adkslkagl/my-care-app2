import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';

interface User {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  setLogin: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setLogout: () => Promise<void>;
  checkLoginStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  setLogin: async (user: User, accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    set({ user, isLoggedIn: true });
  },

  setLogout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isLoggedIn: false });
  },

  // 앱 시작시 토큰 있으면 서버에서 유저 정보 가져오기
  checkLoginStatus: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;

    try {
      const res = await authApi.getMe();
      set({ user: res.data, isLoggedIn: true });
    } catch (e) {
      // 토큰 만료 등 실패시 로그아웃 처리
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      set({ user: null, isLoggedIn: false });
    }
  },
}));