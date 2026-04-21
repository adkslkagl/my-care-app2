import * as SecureStore from 'expo-secure-store';

const NGROK_URL = 'https://434d-222-110-133-193.ngrok-free.app';  // 여기 수정!

export const chatApi = {
  async streamMessage(
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ) {
    const token = await SecureStore.getItemAsync('accessToken');

    try {
      const response = await fetch(`${NGROK_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        onError('서버 오류가 발생했습니다.');
        onDone();
        return;
      }

      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) onChunk(parsed.text);
            if (parsed.error) {
              onError(parsed.error);
              onDone();
              return;
            }
          } catch {}
        }
      }
      onDone();
    } catch (e) {
      onError('네트워크 오류가 발생했습니다.');
      onDone();
    }
  },

  async clearHistory() {
    const token = await SecureStore.getItemAsync('accessToken');
    await fetch(`${NGROK_URL}/api/chat`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
  },
};