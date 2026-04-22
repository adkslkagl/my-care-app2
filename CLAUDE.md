# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # 개발 서버 시작
npx expo start --clear  # Metro 번들러 캐시 클리어 후 시작 (환경변수 변경 시 필수)
npx expo start --android
npx expo start --ios
npm run lint
```

> **중요:** 반드시 `my-care-app/my-care-app/` 디렉토리 안에서 실행. 루트 `my-care-app/`에서 실행하면 `package.json not found` 에러 발생.

## 환경변수

`.env.local` 파일에 관리 (gitignore 적용됨):

```
EXPO_PUBLIC_API_URL=https://<ngrok-subdomain>.ngrok-free.app
```

- `src/api/client.ts`에서 `API_URL`로 읽어 export
- `auth.ts`, `chat.ts`, `emotion.ts`는 `client.ts`에서 `API_URL`을 import해서 사용
- ngrok URL 교체 시 `.env.local` 하나만 수정, 이후 `npx expo start --clear` 재시작 필요

## 탭 구조

| 탭 | 파일 | 설명 |
|----|------|------|
| 홈 | `app/(tabs)/index.tsx` | 환영 화면, 각 탭으로 이동 버튼 |
| 😌 감정체크 | `app/(tabs)/emotion.tsx` | 텍스트 입력 → AI 감정 분석 → 결과 표시 |
| 📋 기록 | `app/(tabs)/history.tsx` | 일별/주별/월별 스트레스 추이 바 차트 |
| 💬 AI상담 | `app/(tabs)/chat.tsx` | 스트리밍 AI 채팅 + 대화 감정분석 버튼 |
| 내 정보 | `app/(tabs)/profile.tsx` | 유저 정보, 로그아웃 |

## API 레이어

| 파일 | 역할 |
|------|------|
| `src/api/client.ts` | Axios 인스턴스. Bearer 토큰 자동 주입, 401 시 토큰 갱신 후 재시도. timeout 10초 |
| `src/api/auth.ts` | 이메일/비밀번호 로그인·회원가입, Google OAuth (`authApi`) |
| `src/api/chat.ts` | SSE 스트리밍 채팅, 대화 기록 삭제 (`chatApi`) |
| `src/api/emotion.ts` | 감정 분석 제출, raw 기록 조회, 그래프용 집계 조회 (`emotionApi`) |

### 백엔드 엔드포인트 요약

```
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/resend-verification
GET  /api/auth/oauth/google?redirect_uri=<encoded>

POST /api/chat                          # SSE 스트리밍
DELETE /api/chat                        # 대화 기록 삭제

POST /api/emotion/check                 # 감정 분석 (5~10초 소요, timeout 60초)
GET  /api/emotion/history?limit=30      # raw 기록
GET  /api/emotion/history?groupBy=day|week|month  # 그래프용 집계
```

## 주요 구현 결정사항

### SSE 스트리밍 (chat.ts)
React Native의 `fetch`는 `response.body`(ReadableStream)를 지원하지 않아 **XMLHttpRequest** 사용:
- `readyState === 3` (LOADING)마다 `responseText.slice(processed)`로 새 청크 파싱
- `readyState >= 2`에서 401 감지 시 즉시 abort → 토큰 갱신 후 재시도

### 감정분석 (emotion.tsx, chat.tsx)
- **감정체크 탭**: 텍스트 직접 입력 → 분석 (하루 마무리 회고 용도)
- **채팅 헤더 버튼**: 채팅 중 유저 메시지 전체를 이어붙여 분석 → 하단 모달로 결과 표시
- `emotionApi.check()`는 AI 응답 대기로 최대 60초 timeout 설정

### 스트레스 추이 그래프 (history.tsx)
외부 차트 라이브러리 없이 React Native `View`로 직접 구현:
- 일별/주별/월별 탭 전환 → `groupBy` 파라미터로 재요청
- 막대 높이 = `avgScore / 100 * CHART_H`, 색상은 level(NORMAL/CAUTION/DANGER)
- 요약 카드: 평균·최고 스트레스, 총 기록 수

### Google OAuth 흐름
```
loginWithGoogle()
  └─ Linking.createURL('/oauth/callback') → redirectUrl 동적 생성
  └─ GET /api/auth/oauth/google?redirect_uri=<encodedRedirectUrl>
  └─ 백엔드: state에 redirect_uri를 base64로 담아 Google 전달
  └─ Google 콜백 → state 디코딩 → 앱 딥링크로 리다이렉트
  └─ app/oauth/callback.tsx에서 params 수신 → setLogin()
```

### 인증 흐름
```
앱 시작 → checkLoginStatus()
  ├─ 토큰 없음 → /(auth)/login
  └─ 토큰 있음 → GET /api/auth/me
       ├─ 성공 → /(tabs)
       ├─ 401/403 → 토큰 삭제 → /(auth)/login
       └─ 네트워크 오류 → 토큰 유지, 로그인 상태 유지 (오프라인 대응)
```

Zustand store(`useAuthStore`): `setLogin()` / `setLogout()` 호출만으로 `_layout.tsx`가 자동 라우팅.
토큰은 `expo-secure-store`에 `accessToken` / `refreshToken` 키로 저장.

## 브랜치 구조

- `chatbotv2` — 이전 버전 (fetch 기반 SSE, URL 하드코딩)
- `chatv3` — 현재 버전 (XHR SSE, .env 통합, OAuth 개선, 감정분석 기능)
