import { client } from './client';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const NGROK_URL = 'https://434d-222-110-133-193.ngrok-free.app';

export const authApi = {
  login: (data: { email: string; password: string }) =>
    client.post('/auth/login', data),

  signup: (data: { email: string; password: string; name: string }) =>
    client.post('/auth/signup', data),

  logout: () =>
    client.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    client.post('/auth/refresh', { refreshToken }),

  getMe: () =>
    client.get('/auth/me'),

  resendVerification: () =>
    client.post('/auth/resend-verification'),

  loginWithGoogle: async () => {
    const redirectUrl = 'exp://192.168.0.65:8081/--/oauth/callback';

    const result = await WebBrowser.openAuthSessionAsync(
      `${NGROK_URL}/api/auth/oauth/google`,
      redirectUrl
    );
    console.log('result:', JSON.stringify(result));
    return result;
  },
};