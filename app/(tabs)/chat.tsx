import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Modal, Alert, ScrollView,
} from 'react-native';
import { chatApi } from '@/src/api/chat';
import { emotionApi, EmotionCheckResult } from '@/src/api/emotion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
}

const LEVEL_CONFIG = {
  NORMAL: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: '정상' },
  CAUTION: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d', label: '주의' },
  DANGER:  { color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', label: '위험' },
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: '안녕하세요! 요양보호사 선생님을 위한 AI 상담사입니다 😊\n업무 관련 궁금한 점이나 힘드신 점을 편하게 말씀해주세요.',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emotionVisible, setEmotionVisible] = useState(false);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [emotionResult, setEmotionResult] = useState<EmotionCheckResult | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
    };
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: '',
      loading: true,
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInput('');
    setIsLoading(true);

    const aiId = aiMessage.id;

    await chatApi.streamMessage(
      userMessage.text,
      (chunk) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiId ? { ...msg, text: msg.text + chunk, loading: true } : msg
          )
        );
        flatListRef.current?.scrollToEnd({ animated: true });
      },
      () => {
        setMessages(prev =>
          prev.map(msg => msg.id === aiId ? { ...msg, loading: false } : msg)
        );
        setIsLoading(false);
      },
      (error) => {
        setMessages(prev =>
          prev.map(msg => msg.id === aiId ? { ...msg, text: error, loading: false } : msg)
        );
        setIsLoading(false);
      }
    );
  };

  const clearChat = async () => {
    await chatApi.clearHistory();
    setMessages([{
      id: Date.now().toString(),
      role: 'ai',
      text: '대화가 초기화되었습니다. 다시 편하게 말씀해주세요 😊',
    }]);
  };

  const analyzeEmotion = async () => {
    const userText = messages
      .filter(m => m.role === 'user')
      .map(m => m.text)
      .join('\n');

    if (!userText) {
      Alert.alert('알림', '먼저 대화를 나눠보세요.');
      return;
    }

    setEmotionResult(null);
    setEmotionLoading(true);
    setEmotionVisible(true);

    try {
      const res = await emotionApi.check(userText);
      setEmotionResult(res.data);
    } catch (e: any) {
      setEmotionVisible(false);
      Alert.alert('오류', e.response?.data?.error ?? '감정 분석에 실패했습니다.');
    } finally {
      setEmotionLoading(false);
    }
  };

  const cfg = emotionResult ? LEVEL_CONFIG[emotionResult.level] : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 AI 상담사</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={analyzeEmotion} disabled={isLoading}>
            <Text style={[styles.headerBtn, styles.emotionBtn]}>😌 감정분석</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat}>
            <Text style={styles.headerBtn}>초기화</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메시지 목록 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.role === 'user' ? styles.userBubble : styles.aiBubble,
          ]}>
            {item.loading && item.text === '' ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Text style={[
                styles.messageText,
                item.role === 'user' ? styles.userText : styles.aiText,
              ]}>
                {item.text}
                {item.loading && <Text style={styles.cursor}>▌</Text>}
              </Text>
            )}
          </View>
        )}
      />

      {/* 입력창 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="메시지를 입력하세요..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>

      {/* 감정 분석 결과 모달 */}
      <Modal
        visible={emotionVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmotionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>대화 감정 분석</Text>

            {emotionLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#5348b7" />
                <Text style={styles.modalLoadingText}>분석 중...</Text>
              </View>
            ) : emotionResult && cfg ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.resultCard, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.scoreNumber, { color: cfg.color }]}>{emotionResult.stressScore}</Text>
                    <Text style={styles.scoreTotal}>/100</Text>
                  </View>
                  <Text style={[styles.levelLabel, { color: cfg.color }]}>{cfg.label} 단계</Text>

                  <View style={styles.divider} />

                  <Text style={styles.aiLabel}>AI 상담사의 말</Text>
                  <Text style={styles.aiResponse}>{emotionResult.aiResponse}</Text>

                  {emotionResult.level === 'DANGER' && (
                    <TouchableOpacity style={styles.expertButton} disabled>
                      <Text style={styles.expertButtonText}>🏥 전문가 연계 (준비 중)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : null}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEmotionVisible(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  headerBtn: { fontSize: 14, color: '#888' },
  emotionBtn: { color: '#5348b7', fontWeight: '600' },
  messageList: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#5348b7', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#333' },
  cursor: { color: '#5348b7' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#fafafa',
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#5348b7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendButtonText: { color: '#fff', fontWeight: '600' },

  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },
  modalLoading: { alignItems: 'center', paddingVertical: 40 },
  modalLoadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  resultCard: { borderWidth: 1.5, borderRadius: 16, padding: 20, marginBottom: 16 },
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
  closeButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  closeButtonText: { color: '#374151', fontWeight: '600', fontSize: 15 },
});
