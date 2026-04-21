import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/useAuthStore';
import * as Linking from 'expo-linking';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setLogin } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = response.data;
      await setLogin(user, accessToken, refreshToken);
    } catch (error: any) {
      const msg = error.response?.data?.error || '이메일이나 비밀번호를 확인하세요.';
      Alert.alert('로그인 실패', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await authApi.loginWithGoogle();
      console.log('result:', JSON.stringify(result));

      const url = (result as any).url;
      if (url) {
        const { queryParams } = Linking.parse(url);
        console.log('queryParams:', queryParams);

        if (queryParams?.accessToken && queryParams?.refreshToken) {
          const user = {
            id: Number(queryParams.userId),
            email: String(queryParams.email),
            name: String(queryParams.name),
            emailVerified: true,
          };
          await setLogin(user, String(queryParams.accessToken), String(queryParams.refreshToken));
        }
      }
    } catch (error) {
      Alert.alert('오류', 'Google 로그인에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="로그인" onPress={handleLogin} />
      )}

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
        <Text style={styles.googleText}>Google로 로그인</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 10 }}>
        <Button
          title="회원가입"
          onPress={() => router.push('/(auth)/signup')}
          color="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  googleButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
  },
  googleText: { color: '#444', fontWeight: '600' },
});