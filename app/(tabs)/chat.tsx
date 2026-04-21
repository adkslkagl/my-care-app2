import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { chatApi } from '@/src/api/chat';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  loading?: boolean;
}

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
        // 스트리밍 중 텍스트 업데이트
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiId
              ? { ...msg, text: msg.text + chunk, loading: true }
              : msg
          )
        );
        flatListRef.current?.scrollToEnd({ animated: true });
      },
      () => {
        // 완료
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiId ? { ...msg, loading: false } : msg
          )
        );
        setIsLoading(false);
      },
      (error) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiId ? { ...msg, text: error, loading: false } : msg
          )
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 AI 상담사</Text>
        <TouchableOpacity onPress={clearChat}>
          <Text style={styles.clearButton}>대화 초기화</Text>
        </TouchableOpacity>
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
            item.role === 'user' ? styles.userBubble : styles.aiBubble
          ]}>
            {item.loading && item.text === '' ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Text style={[
                styles.messageText,
                item.role === 'user' ? styles.userText : styles.aiText
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  clearButton: { fontSize: 14, color: '#888' },
  messageList: { padding: 16, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#5348b7',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
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
});