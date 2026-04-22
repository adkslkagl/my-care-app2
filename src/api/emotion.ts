import { client } from './client';

export type EmotionLevel = 'NORMAL' | 'CAUTION' | 'DANGER';
export type GroupBy = 'day' | 'week' | 'month';

export interface EmotionCheckResult {
  stressScore: number;
  level: EmotionLevel;
  aiResponse: string;
}

export interface EmotionRecord {
  id: number;
  content: string;
  stressScore: number;
  level: EmotionLevel;
  aiResponse: string;
  createdAt: string;
}

export interface EmotionAggregate {
  period: string;
  avgScore: number;
  count: number;
  level: EmotionLevel;
}

export const emotionApi = {
  check: (message: string) =>
    client.post<EmotionCheckResult>('/emotion/check', { message }, { timeout: 60000 }),

  historyRaw: (limit = 30) =>
    client.get<EmotionRecord[]>(`/emotion/history?limit=${limit}`),

  historyChart: (groupBy: GroupBy) =>
    client.get<EmotionAggregate[]>(`/emotion/history?groupBy=${groupBy}`),
};
