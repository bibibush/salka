// 실행 환경 설정. Vite 환경변수(VITE_*)에서 읽는다 (PDD §12).
export const apiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
