import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { authApi } from '@/src/api/auth';
import { useRouter } from 'expo-router';

export default function Home() {
  const { user, setLogout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 이미 만료된 토큰이어도 로컬 상태는 초기화
    } finally {
      await setLogout();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>환영합니다!</Text>
      <Text style={styles.name}>{user?.name || '사용자'}님, 반갑습니다.</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {/* 내 정보 보기 */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Text style={styles.profileButtonText}>✅ 내 정보 보기 →</Text>
      </TouchableOpacity>

      {/* AI 상담사 */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => router.push('/(tabs)/chat')}
      >
        <Text style={styles.chatButtonText}>💬 AI 상담사와 대화하기 →</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Button title="로그아웃" onPress={handleLogout} color="#ff4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  welcome: { fontSize: 18, color: '#888' },
  name: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  email: { fontSize: 14, color: '#aaa' },
  profileButton: {
    marginTop: 20,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  profileButtonText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  chatButton: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chatButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
});