import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from './client';

function parseLines(
  text: string,
  onChunk: (text: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): boolean {
  for (const line of text.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') {
      onDone();
      return true;
    }
    try {
      const parsed = JSON.parse(data);
      if (parsed.text) onChunk(parsed.text);
      if (parsed.error) {
        onError(parsed.error);
        onDone();
        return true;
      }
    } catch {}
  }
  return false;
}

function xhrStream(
  token: string,
  message: string,
  onChunk: (text: string) => void,
  onError: (error: string) => void,
  onDone: () => void
): Promise<number> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/api/chat`);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    let processed = 0;
    let resolved = false;
    let streamDone = false;
    let aborted = false;

    const abort401 = () => {
      if (!resolved) {
        resolved = true;
        aborted = true;
        xhr.abort();
        resolve(401);
      }
    };

    xhr.onreadystatechange = () => {
      if (aborted) return;

      if (xhr.readyState >= 2 && xhr.status === 401) {
        abort401();
        return;
      }

      if ((xhr.readyState === 3 || xhr.readyState === 4) && !streamDone) {
        const newText = xhr.responseText.slice(processed);
        processed = xhr.responseText.length;
        if (newText) streamDone = parseLines(newText, onChunk, onError, onDone);
      }

      if (xhr.readyState === 4) {
        if (!streamDone) {
          if (xhr.status >= 400) onError('서버 오류가 발생했습니다.');
          streamDone = true;
          onDone();
        }
        if (!resolved) {
          resolved = true;
          resolve(xhr.status);
        }
      }
    };

    xhr.onerror = () => {
      if (!resolved) {
        resolved = true;
        onError('네트워크 오류가 발생했습니다.');
        onDone();
        resolve(-1);
      }
    };

    xhr.send(JSON.stringify({ message }));
  });
}

export const chatApi = {
  async streamMessage(
    message: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ) {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const status = await xhrStream(token!, message, onChunk, onError, onDone);

      if (status === 401) {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
          onError('로그인이 만료되었습니다. 다시 로그인해주세요.');
          onDone();
          return;
        }

        const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const newToken = refreshRes.data.accessToken;
        await SecureStore.setItemAsync('accessToken', newToken);

        await xhrStream(newToken, message, onChunk, onError, onDone);
      }
    } catch (e) {
      console.error('Chat error:', e);
      onError('네트워크 오류가 발생했습니다.');
      onDone();
    }
  },

  async clearHistory() {
    const token = await SecureStore.getItemAsync('accessToken');
    await fetch(`${API_URL}/api/chat`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
