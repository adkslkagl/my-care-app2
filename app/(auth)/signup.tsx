// app/(auth)/signup.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api/auth';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    try {
      await authApi.signup({ email, password, name });
      Alert.alert("성공", "회원가입이 완료되었습니다. 로그인해주세요.");
      router.replace('/(auth)/login'); // ← 수정
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "가입 실패";
      Alert.alert("에러", errorMsg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        placeholder="이름"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="가입하기" onPress={handleSignup} />
      <View style={{ marginTop: 10 }}>
        <Button
          title="로그인으로 돌아가기"
          onPress={() => router.back()}
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
});