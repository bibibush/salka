// 실행 환경 설정. Expo 는 EXPO_PUBLIC_ 접두사 환경변수만 클라이언트에 노출한다 (PDD §12).
// iOS 시뮬레이터는 localhost, Android 에뮬레이터는 10.0.2.2 를 사용한다.
export const apiBaseUrl: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
