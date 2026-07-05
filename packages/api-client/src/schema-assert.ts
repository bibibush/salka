// 생성된 OpenAPI 타입과 shared-types 의 손수 작성한 도메인 타입이 구조적으로
// 일치하는지 컴파일 타임에 검증한다. 백엔드 스키마가 변경되어 두 타입이 어긋나면
// 이 파일의 type-check 가 실패하여 드리프트를 알린다.
import type { AnalysisResult as SharedAnalysisResult } from '@cosmetics-analyzer/shared-types';

import type { components } from './generated/schema';

type GeneratedAnalysisResult = components['schemas']['AnalysisResultSchema'];

type Extends<A, B> = A extends B ? true : false;

// 양방향 할당 가능성으로 구조 동치를 보장한다.
const _generatedMatchesShared: Extends<GeneratedAnalysisResult, SharedAnalysisResult> = true;
const _sharedMatchesGenerated: Extends<SharedAnalysisResult, GeneratedAnalysisResult> = true;

void _generatedMatchesShared;
void _sharedMatchesGenerated;
