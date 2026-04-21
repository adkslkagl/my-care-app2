import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const { user, setLogout } = useAuthStore();
  const router = useRouter();

  const handleResend = async () => {
    setLoading(true);
    try {
      await authApi.resendVerification();
      Alert.alert('발송 완료', '인증 메일을 다시 보냈습니다. 메일함을 확인해주세요.');
    } catch (error) {
      Alert.alert('오류', '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await setLogout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✉️</Text>
      <Text style={styles.title}>이메일 인증이 필요해요</Text>
      <Text style={styles.desc}>
        <Text style={styles.email}>{user?.email}</Text>
        {'\n'}으로 인증 메일을 보냈어요.{'\n'}
        메일의 링크를 클릭하면 인증이 완료돼요.
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.buttonGroup}>
          <Button title="인증 메일 다시 보내기" onPress={handleResend} />
          <View style={{ marginTop: 10 }}>
            <Button title="로그아웃" onPress={handleLogout} color="#999" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#fff' },
  icon: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  email: { fontWeight: 'bold', color: '#333' },
  buttonGroup: { width: '100%' },
});
