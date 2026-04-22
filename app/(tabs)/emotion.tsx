import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { emotionApi, EmotionCheckResult } from '@/src/api/emotion';

const LEVEL_CONFIG = {
  NORMAL: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: '정상' },
  CAUTION: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: '주의' },
  DANGER:  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: '위험' },
};

export default function EmotionCheck() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmotionCheckResult | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await emotionApi.check(message.trim());
      setResult(res.data);
    } catch (e: any) {
      console.error('emotion check error:', JSON.stringify({
        status: e.response?.status,
        data: e.response?.data,
        message: e.message,
      }));
      const msg = e.response?.data?.error
        ?? e.response?.data?.message
        ?? `(${e.response?.status ?? e.code ?? '?'}) ${e.message}`;
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };

  const cfg = result ? LEVEL_CONFIG[result.level] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>감정 체크</Text>
      <Text style={styles.subtitle}>오늘 하루 어떠셨나요? 편하게 적어주세요.</Text>

      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="오늘 있었던 일이나 감정을 자유롭게 적어주세요..."
        multiline
        numberOfLines={5}
        maxLength={500}
        textAlignVertical="top"
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.submitButton, (!message.trim() || loading) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!message.trim() || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>분석하기</Text>
        }
      </TouchableOpacity>

      {result && cfg && (
        <View style={[styles.resultCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNumber, { color: cfg.color }]}>{result.stressScore}</Text>
            <Text style={styles.scoreTotal}>/100</Text>
          </View>
          <Text style={[styles.levelLabel, { color: cfg.color }]}>{cfg.label} 단계</Text>

          <View style={styles.divider} />

          <Text style={styles.aiLabel}>AI 상담사의 말</Text>
          <Text style={styles.aiResponse}>{result.aiResponse}</Text>

          {result.level === 'DANGER' && (
            <TouchableOpacity style={styles.expertButton} disabled>
              <Text style={styles.expertButtonText}>🏥 전문가 연계 (준비 중)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#5348b7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitDisabled: { backgroundColor: '#c4b5fd' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  scoreNumber: { fontSize: 56, fontWeight: 'bold', lineHeight: 64 },
  scoreTotal: { fontSize: 20, color: '#9ca3af', marginBottom: 10, marginLeft: 4 },
  levelLabel: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginBottom: 14 },
  aiLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '600', marginBottom: 8 },
  aiResponse: { fontSize: 15, color: '#374151', lineHeight: 24 },
  expertButton: {
    marginTop: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    opacity: 0.7,
  },
  expertButtonText: { color: '#dc2626', fontWeight: '600' },
});
