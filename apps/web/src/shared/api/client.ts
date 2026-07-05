// 앱 전역에서 사용하는 단일 API 클라이언트 인스턴스.
// 모든 백엔드 호출은 이 인스턴스(= api-client 의 ky wrapper)를 통해 수행한다 (PDD §4.3).
import { createApiClient } from '@cosmetics-analyzer/api-client';

import { apiBaseUrl } from '@/shared/config';

export const apiClient = createApiClient({ baseUrl: apiBaseUrl });
