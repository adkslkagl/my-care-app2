import { client, API_URL } from './client';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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
    const redirectUrl = Linking.createURL('/oauth/callback');

    const result = await WebBrowser.openAuthSessionAsync(
      `${API_URL}/api/auth/oauth/google?redirect_uri=${encodeURIComponent(redirectUrl)}`,
      redirectUrl
    );
    console.log('result:', JSON.stringify(result));
    return result;
  },
};
