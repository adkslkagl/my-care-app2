import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function OAuthCallback() {
  const params = useLocalSearchParams();
  const { setLogin } = useAuthStore();

  useEffect(() => {
    const handle = async () => {
      if (params.accessToken && params.refreshToken) {
        const user = {
          id: Number(params.userId),
          email: String(params.email),
          name: String(params.name),
          emailVerified: true,
        };
        await setLogin(user, String(params.accessToken), String(params.refreshToken));
        // ✅ setLogin만 하면 _layout.tsx가 알아서 (tabs)로 이동!
      }
    };
    handle();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}