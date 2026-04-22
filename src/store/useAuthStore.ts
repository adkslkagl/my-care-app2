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

  checkLoginStatus: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;

    try {
      const res = await authApi.getMe();
      set({ user: res.data, isLoggedIn: true });
    } catch (e: any) {
      // 네트워크 오류일 때는 토큰 유지, 인증 오류(401/403)일 때만 로그아웃
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ user: null, isLoggedIn: false });
      }
    }
  },
}));