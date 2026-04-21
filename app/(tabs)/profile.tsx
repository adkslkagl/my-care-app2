// app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { authApi } from '../../src/api/auth';

export default function Profile() {
  const { user, setLogout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // 1. 백엔드에 로그아웃 요청 (Redis 토큰 삭제)
      await authApi.logout();
    } catch (error) {
      console.log("서버 로그아웃 요청 실패 (이미 만료되었을 수 있음)");
    } finally {
      // 2. 서버 응답 여부와 상관없이 앱 내 토큰 삭제 및 상태 초기화
      await setLogout();
      Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.label}>이름</Text>
        <Text style={styles.value}>{user?.name || "정보 없음"}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.label}>이메일</Text>
        <Text style={styles.value}>{user?.email || "정보 없음"}</Text>
      </View>

      <Button title="로그아웃" onPress={handleLogout} color="#ff4444" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  profileCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 20, elevation: 2 },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  value: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
});