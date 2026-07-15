# 화장품 구매 판단 보조 도구 PDD

## 1. 프로젝트 개요

- **제품**: 화장품 바코드 또는 전성분 이미지를 입력받아 LLM 기반으로 성분을 해석·스코어링하는 소비자용 서비스
- **플랫폼**: iOS / Android (React Native Expo), Web (React + Vite)
- **백엔드**: FastAPI
- **포지셔닝**: 참고용 성분 해석 도구 (의료/법적 판정 도구 아님)
- **MVP 정책**: 무상태(stateless), 사용자 인증 없음, 데이터 영구 저장 없음

---

## 2. 기술 스택

### 2.1 공통 / 모노레포

| 항목 | 선택 | 비고 |
| --- | --- | --- |
| 모노레포 | Turborepo (LTS, v2 계열) | pipeline caching |
| 패키지 매니저 | pnpm + workspaces | |
| 런타임 | Node.js 22 LTS | |
| 언어 | TypeScript 5.x (strict) | |
| 린터/포매터 | ESLint + Prettier | 공유 config 패키지 |

### 2.2 Mobile (React Native)

| 항목 | 선택 |
| --- | --- |
| Expo SDK | 최신 LTS (SDK 54+) |
| React Native | Expo SDK가 요구하는 LTS 버전 |
| React | 19 |
| 라우팅 | expo-router |
| 카메라 | expo-camera |
| 이미지 선택 | expo-image-picker |
| 바코드 (Phase 2) | expo-barcode-scanner / expo-camera 내장 |
| 스타일링 | NativeWind v4 |
| 클라이언트 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| HTTP | ky |
| 폼 | react-hook-form + zod |

### 2.3 Web (React + Vite)

| 항목 | 선택 |
| --- | --- |
| React | 19 |
| 번들러 | Vite (LTS, v6+) |
| 라우팅 | React Router v7 |
| 스타일링 | Tailwind CSS v4 |
| 클라이언트 상태 | Zustand |
| 서버 상태 | TanStack Query v5 |
| 폼 | react-hook-form + zod |

### 2.4 Backend (FastAPI)

| 항목 | 선택 |
| --- | --- |
| Python | 3.12+ |
| 프레임워크 | FastAPI (최신 안정) |
| 검증 | Pydantic v2 |
| ASGI 서버 | uvicorn (개발), gunicorn+uvicorn workers (운영) |
| DI 컨테이너 | dependency-injector |
| HTTP 클라이언트 | httpx (async) |
| 설정 | pydantic-settings |
| 테스트 | pytest, pytest-asyncio, httpx ASGI client |
| 린터/타입 | ruff, mypy (strict) |
| Rate limit | slowapi |
| 로깅 | structlog (JSON 로그) |

### 2.5 외부 AI provider

| 역할 | 선택 | 비고 |
| --- | --- | --- |
| 이미지 → 텍스트 추출 (OCR) | Google Gemini API | 전통적 OCR 대신 Gemini 비전으로 전성분 이미지에서 텍스트를 추출한다. `OcrPort` 구현체(`OCR_PROVIDER=gemini`). |
| 성분 분석 (LLM) | OpenAI GPT | 추출된 성분 텍스트를 GPT로 해석·스코어링한다. `LlmAnalysisPort` 구현체(`LLM_PROVIDER=openai`). |

- 결정 근거: 전통적 OCR(Clova/GCV/Tesseract) 대비 Gemini 비전이 전성분 라벨의 다양한 레이아웃·저화질에 강인하고 파이프라인을 단순화하며, 성분 해석은 구조화 출력(function calling/JSON schema)이 성숙한 OpenAI GPT를 사용한다.
- 구체 모델 버전은 환경변수가 아니라 `Settings` 객체(`apps/api/src/core/config.py`)에 고정 기본값으로 둔다: `openai_model=gpt-5.5`, `gemini_model=gemini-3.5-flash`. (결정 근거: 모델 버전은 코드 릴리스와 함께 검증·배포되어야 하는 값이라 배포 환경별 env 재정의 대상에서 제외하고 코드에 고정한다. `ClassVar`로 선언해 pydantic-settings 필드가 아니므로 env 소스에서 자동 제외된다.)
- 추론 강도는 어댑터(infrastructure)에서만 설정하고 Port·use case에는 노출하지 않는다(provider별 튜닝 값). `Settings` 객체에 고정 기본값으로 두며 env로 재정의하지 않는다: OpenAI `openai_reasoning_effort=medium`(reasoning effort), Gemini `gemini_thinking_level=medium`(thinking level). 둘 다 `minimal|low|medium|high` 값 체계를 공유한다.
- 두 provider 모두 Port 인터페이스를 통해서만 접근하며, Mock(`*_PROVIDER=mock`)과 실제 구현체(`OpenAiLlmAnalysisAdapter`/`GeminiOcrAdapter`)가 모두 등록되어 있다. 실제 provider 선택 시 API 키가 없으면 앱 기동 시점에 fail-fast 한다.
- 실제 구현체는 각 SDK의 최신 API 를 사용한다: OpenAI 는 Responses API(`client.responses.parse` + `text_format`), Gemini 는 Interactions API(`client.aio.interactions.create`).
- 구조화 출력 JSON 스키마(`RawResult`)는 mock·OpenAI 어댑터가 공유하는 단일 소스(`infrastructure/llm/raw_result.py`)로 관리해 스키마 드리프트를 방지한다.

### 2.6 인프라 (참고)

- Mobile: EAS Build / Submit
- Web: 정적 호스팅 (Vercel / Cloudflare Pages 등, 추후 결정)
- Backend: Docker 컨테이너 (배포 플랫폼 추후 결정)

---

## 3. 모노레포 구조

```text
cosmetics-analyzer/
├── apps/
│   ├── mobile/                 # Expo (React Native)
│   ├── web/                    # Vite (React)
│   └── api/                    # FastAPI
├── packages/
│   ├── shared-types/           # 도메인 타입, API DTO 타입 (TS)
│   ├── api-client/             # OpenAPI 기반 TS 클라이언트 (자동 생성)
│   ├── ui-tokens/              # 디자인 토큰 (color, spacing, radius...)
│   ├── config-tailwind/        # Tailwind preset (RN/Web 공용 토큰)
│   ├── config-eslint/
│   └── config-typescript/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

- 토큰은 `packages/ui-tokens`에서 `config-tailwind`를 통해 preset으로 export
- NativeWind와 Web Tailwind가 동일 preset 사용하여 디자인 일관성 유지

---

## 4. 프론트엔드 아키텍처

### 4.1 React Native: FSD 패턴

클린 아키텍처는 적용하지 않고 FSD 레이어 구조만 따른다. Web(§4.2)과 동일한
원칙이며, 도메인 로직은 `entities/`와 `features/`에 직접 위치한다.

#### FSD 레이어 (상위에서 하위)

- `app/`: Provider, 글로벌 설정, expo-router 진입점
- `pages/`: 스크린 (expo-router 라우트와 매핑)
- `widgets/`: 완결적 UI 블록 (결과 카드, 분석 헤더 등)
- `features/`: 사용자 액션 단위 (capture-ingredients, analyze, view-result)
- `entities/`: 도메인 엔티티 표현 (Ingredient, AnalysisResult, Product)
- `shared/`: UI primitive, 인프라, util, API client

#### 데이터 진입점

- repository/usecase 분리 없음, TanStack Query의 query function이 데이터 진입점
- 서버 상태는 TanStack Query, 클라이언트 로컬 상태는 Zustand 사용
- API 호출은 `shared`의 API client(`ky` + 생성된 타입)를 통해서만 수행

#### import 제약

- 상위 레이어는 하위 레이어만 import (FSD 표준)
- 같은 레이어 내 슬라이스 간 cross-import 금지
- ESLint `eslint-plugin-boundaries` 또는 `steiger`로 강제

### 4.2 Web: FSD 패턴 (클린 아키텍처 미적용)

동일한 FSD 레이어 구조 사용. 단,

- 도메인 로직은 `entities/`와 `features/`에 직접 위치
- repository/usecase 분리 없음, TanStack Query의 query function이 데이터 진입점
- 가벼운 SPA에 적합한 단순 구조 유지

### 4.3 공유 코드 전략

- 도메인 타입(`shared-types`), API 클라이언트(`api-client`), 토큰(`ui-tokens`), Tailwind preset은 모노레포 패키지로 공유
- 컴포넌트는 공유하지 않음 (RN과 Web의 primitives 차이)
- API 클라이언트 타입은 백엔드 OpenAPI 스펙에서 `openapi-typescript`로 생성하고, 호출은 `ky` 기반 wrapper로 수행

---

## 5. 백엔드 아키텍처 (클린 아키텍처 + DI)

### 5.1 디렉터리 구조

```text
apps/api/
├── src/
│   ├── domain/                  # 엔터프라이즈 비즈니스 룰
│   │   ├── entities/
│   │   ├── value_objects/
│   │   └── exceptions/
│   ├── application/             # 애플리케이션 비즈니스 룰
│   │   ├── use_cases/
│   │   ├── ports/               # 추상 인터페이스 (LLM/OCR/Barcode)
│   │   └── dto/
│   ├── infrastructure/          # 외부 의존성 구현체
│   │   ├── llm/                 # mock, openai (성분 분석)
│   │   ├── ocr/                 # mock, gemini (이미지→텍스트 추출)
│   │   ├── barcode/             # Phase 2 어댑터
│   │   └── http/
│   ├── interfaces/              # API 진입점
│   │   ├── api/v1/              # FastAPI 라우터
│   │   ├── schemas/             # Pydantic 요청/응답
│   │   └── middlewares/
│   ├── di/
│   │   └── containers.py        # dependency-injector Container
│   ├── core/
│   │   ├── config.py
│   │   └── logging.py
│   └── main.py
├── tests/
└── pyproject.toml
```

### 5.2 의존성 방향

- `interfaces -> application -> domain`
- `infrastructure -> application -> domain`
- `domain`은 다른 레이어에 의존하지 않음 (순수 Python)
- `application`은 Port(추상)만 의존, 구현체는 DI로 주입

### 5.3 DI 정책 (dependency-injector)

- `Container`로 의존성 그래프 명시
- 라우터에서 `Depends(Provide[Container.use_case])`로 주입
- 환경별로 Container 오버라이드 (`test`에서 Mock으로 교체)
- 외부 의존성(LLM/OCR/Barcode) 모두 Port 인터페이스를 통해서만 사용

### 5.4 추상화된 Port

```python
# application/ports/llm_analysis_port.py
class LlmAnalysisPort(Protocol):
    async def analyze(self, ingredients: list[str]) -> AnalysisResult: ...

# application/ports/ocr_port.py
class OcrPort(Protocol):
    async def extract_ingredients(self, image: bytes) -> list[str]: ...

# application/ports/barcode_lookup_port.py  (Phase 2)
class BarcodeLookupPort(Protocol):
    async def lookup(self, barcode: str) -> Product | None: ...
```

각 Port는 환경변수 `LLM_PROVIDER`, `OCR_PROVIDER`, `BARCODE_PROVIDER`로 구현체를 선택한다. 초기에는 Mock 구현체를 제공하며, 확정된 provider는 다음과 같다.

- `OcrPort` → Gemini 비전 구현체(`OCR_PROVIDER=gemini`): 전성분 이미지에서 텍스트 추출
- `LlmAnalysisPort` → OpenAI GPT 구현체(`LLM_PROVIDER=openai`): 성분 해석·스코어링

---

## 6. 도메인 모델

### Entity

| 이름 | 속성 |
| --- | --- |
| `Ingredient` | name, inci_name?, category? |
| `IngredientAssessment` | ingredient, verdict, score, reason |
| `AnalysisResult` | overall_score, verdict, summary, recommendation, assessments[], cautions[], disclaimer |
| `Product` (Phase 2) | barcode, name, brand, ingredients[] |

### Value Object

- `Score`: 정수 0~100
- `Verdict`: `GOOD` / `CAUTION` / `BAD`
- `Recommendation`: `RECOMMENDED` / `NEUTRAL` / `CAUTION_NEEDED`

추천 문구는 단정형 금지, 참고 판단형만 허용한다.

---

## 7. API 명세 (요약)

Base path: `/api/v1`

### Phase 1

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/analysis/by-ingredients-image` | multipart `image` | `AnalysisResult` |
| POST | `/analysis/by-ingredients-text` | `{ ingredients: string }` | `AnalysisResult` |
| GET | `/health` | - | `{ status: "ok" }` |

### Phase 2

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/analysis/by-barcode-image` | multipart `image` | `AnalysisResult + Product` |
| POST | `/analysis/by-barcode` | `{ barcode: string }` | `AnalysisResult + Product` |

### AnalysisResult 스키마 (예시)

```json
{
  "overall_score": 78,
  "verdict": "GOOD",
  "summary": "전반적으로 무난한 편",
  "recommendation": "RECOMMENDED",
  "assessments": [
    { "ingredient": "Niacinamide", "verdict": "GOOD", "score": 90, "reason": "..." }
  ],
  "cautions": [
    { "ingredient": "...", "reason": "..." }
  ],
  "disclaimer": "본 결과는 참고용입니다..."
}
```

- 오류 응답은 RFC 7807 형식 (`application/problem+json`) 사용
- OpenAPI 스펙은 FastAPI가 자동 생성하고 `api-client` 패키지가 이를 소비

---

## 8. 분석 파이프라인

```text
이미지 입력
  -> OcrPort.extract_ingredients(image)         # Gemini 비전으로 텍스트 추출
  -> 텍스트 정규화 (구분자 split, 공백/특수문자 정리, 중복 제거)
  -> LlmAnalysisPort.analyze(ingredients)       # OpenAI GPT로 해석·스코어링
  -> 결과 정규화 (Score/Verdict 범위 검증)
  -> 면책 문구 부착
  -> AnalysisResult 반환
```

- LLM 응답은 구조화된 JSON 강제 (function calling / response schema)
- Pydantic으로 응답 검증 실패 시 재시도 1회, 그래도 실패 시 5xx
- 텍스트 입력 경로는 OCR 단계 스킵

---

## 9. 무상태 정책 (MVP)

- DB 없음
- 사용자 인증 없음, 세션 없음
- 업로드된 이미지는 메모리에서만 처리, 디스크 저장 금지
- 분석 결과는 응답으로만 반환, 서버에 저장하지 않음
- 클라이언트는 마지막 결과를 메모리(상태 store)에만 보관

Phase 3에서 히스토리/비교 기능 검토 시 DB/인증 정책을 재설계한다.

---

## 10. 단계별 개발 범위

### Phase 1 (MVP)

- 모노레포 + 3개 앱 셋업
- 디자인 토큰 + Tailwind preset 공유
- API: `POST /analysis/by-ingredients-image` (+ text 경로)
- LLM/OCR Port + Mock 구현체
- 모바일: 카메라 촬영(메인) + 이미지 업로드/텍스트 입력(보조) -> 분석 -> 결과 화면
- 웹: 이미지 입력 -> 분석 -> 결과 화면
- 면책 문구 포함

### Phase 2

- 바코드 입력 추가 (`BarcodeLookupPort` + 구현체)
- 결과 일관성 강화 (프롬프트 정교화, JSON schema 강화, 검증/재시도)
- 에러/예외 케이스 처리 고도화 (저화질, 미인식, 부분 인식)
- Rate limiting 적용

### Phase 3

- 분석 히스토리 / 비교 (DB·인증 정책 재검토 필요)
- 결과 표현 정교화, 카테고리 정리
- 품질 모니터링 (분석 성공률, LLM 응답 검증 실패율 등)

---

## 11. 품질 및 테스트

| 영역 | 도구 |
| --- | --- |
| TS 단위 테스트 | Vitest (web/shared), Jest (RN) |
| Python 단위 테스트 | pytest, pytest-asyncio |
| API 통합 테스트 | httpx ASGI client + pytest |
| 타입 | TypeScript strict, mypy strict |
| 린트 | ESLint, ruff |
| 포맷 | Prettier, ruff format |
| Pre-commit | husky + lint-staged |
| 커밋 메시지 | Conventional Commits |
| CI | GitHub Actions (lint, test, type-check 필수) |
| CD | GitHub Actions — 모바일 EAS(build/submit/update) [R5-CD2]; 웹/백엔드은 배포 플랫폼 결정 후 [R5-CD1] |

E2E(Detox / Playwright)는 Phase 2 이후 도입 검토.

---

## 12. 환경 변수

### Backend (`apps/api/.env`)

- `ENV` (dev / staging / prod)
- `LLM_PROVIDER` (mock | openai) - 성분 분석
- `OCR_PROVIDER` (mock | gemini) - 이미지→텍스트 추출
- `BARCODE_PROVIDER` (mock | ...) - Phase 2
- `LLM_API_KEY` - LLM(GPT) provider (openai 선택 시 키 필수). 모델·추론 강도(`openai_model`/`openai_reasoning_effort`)는 env가 아니라 `Settings` 객체에 고정한다.
- `OCR_API_KEY` - OCR(Gemini) provider (gemini 선택 시 키 필수). 모델·추론 강도(`gemini_model`/`gemini_thinking_level`)는 env가 아니라 `Settings` 객체에 고정한다.
- `CORS_ORIGINS`
- `RATE_LIMIT_PER_MIN`
- `MAX_UPLOAD_BYTES`, `DISCLAIMER_TEXT`

### Mobile (`apps/mobile/.env`)

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_TOKEN` - EAS CLI 인증용. 로컬 파일에는 `<expo-access-token>` 플레이스홀더만 문서화하고, CI 실제 값은 GitHub Actions `Secrets.EXPO_TOKEN`으로만 주입한다. (결정 근거: 워크플로가 요구하는 변수를 로컬에서도 식별할 수 있게 하되 실제 시크릿은 저장소와 분리한다.)

### Web (`apps/web/.env`)

- `VITE_API_BASE_URL`

---

## 13. 보안 / 정책

- 이미지: 메모리 처리 후 즉시 폐기, 로그에 바이너리 미포함
- CORS: 허용 origin 화이트리스트 명시
- Rate limiting: IP 기준 (slowapi)
- 응답에 면책 문구 항상 포함 (백엔드가 부착)
- 강한 단정 표현("유해", "위험", "안전") 금지 - 프롬프트와 후처리에서 차단
- 의료적 진단/처방 문구 금지
- LLM 호출 시 PII 입력 금지 (입력은 성분 텍스트로 한정)

---

## 14. 컨벤션

- 패키지명: `@cosmetics/{name}`
- 브랜치: trunk-based, `feature/*`, `fix/*` 단명 브랜치
- 커밋: Conventional Commits (`feat`, `fix`, `chore`, ...)
- 파일/폴더 네이밍:
  - TS: kebab-case 파일, PascalCase 컴포넌트
  - Python: snake_case
- API 버저닝: URI 버저닝 (`/api/v1`)

---

## 15. 추후 결정 사항

- 바코드 -> 제품 매핑 소스 (Phase 2)
- 웹 배포 플랫폼 (정적 호스팅: Vercel / Cloudflare Pages 등)
- 백엔드 배포 플랫폼
- 분석 결과 캐싱 정책 (필요 시 Redis 도입 검토)
- 에러 모니터링 (Sentry 등)
- E2E 테스트 도입 시점
- Phase 3 DB 및 인증 설계
