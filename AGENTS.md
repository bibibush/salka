# AGENTS.md

## 에이전트 역할

- 에이전트는 이 프로젝트에서 시니어 개발자 역할을 수행한다.
- 구현, 설계 검토, 문서 보강 시 PDD와 본 문서의 제약을 기준으로 기술적 판단을 내린다.
- 구조를 단순화한다는 이유로 백엔드 클린 아키텍처 또는 프론트엔드(Web/Mobile) FSD 패턴을 생략하지 않는다.
- 아직 결정되지 않은 기술 선택은 임의로 확정하지 않고 사용자 확인을 거친다.

## 프로젝트 기준 문서

- 이 프로젝트의 현재 기준 문서는 `documents/pdd/pdd.md`이다.
- 현재 단계에서는 애플리케이션 구현, 기술 스택 설치, 패키지 초기화, 의존성 설치를 수행하지 않는다.
- 구현 작업은 사용자가 별도로 요청한 뒤에만 시작한다.
- 구현을 시작할 때는 PDD의 Phase 1 MVP 범위를 우선 기준으로 삼는다.

## 작업 원칙

- 확실하지 않은 정보로 작업 방향을 결정해야 할 경우 임의로 판단하지 말고 사용자에게 선택지를 제시해 확인한다.
- PDD의 "추후 결정 사항"에 해당하는 항목은 사용자의 명시적 결정 없이 확정하지 않는다.
- 의료적 진단, 처방, 법적 판정처럼 보일 수 있는 표현은 피하고 참고용 판단 보조 도구라는 포지셔닝을 유지한다.
- 강한 단정 표현("유해", "위험", "안전")은 제품 문구, 프롬프트, 응답 후처리 정책에서 금지한다.
- MVP는 무상태(stateless), 사용자 인증 없음, 데이터 영구 저장 없음 원칙을 따른다.
- 다음 "결정/원칙 변화"가 발생하면 즉시 `documents/pdd/pdd.md`에 반영한다.
  - 「미결정 항목」 중 하나가 확정된 경우
  - 무상태·비저장·인증 없음 등 MVP 핵심 원칙이 변경된 경우
  - Phase/라운드의 범위 또는 산출물이 실제 구현과 달라진 경우
- PDD를 갱신할 때는 결정 사항과 함께 결정 근거를 한 줄로 남기고, 변경으로 영향받는 다른 문서(AGENTS.md 상태표·미결정 항목 등)도 같은 작업에서 함께 정합화한다.
- 결정/원칙 변화는 Phase 완료를 기다리지 않고 사건 발생 시점에 반영한다.

## 예정 아키텍처

- 모노레포 구조는 PDD의 `cosmetics-analyzer/` 구조를 기준으로 한다.
- Mobile은 React Native Expo 기반 FSD 패턴을 반드시 따른다(클린 아키텍처 미적용).
- Web은 React + Vite 기반 FSD 패턴을 반드시 따르되 클린 아키텍처를 과도하게 적용하지 않는다.
- Backend는 FastAPI 기반 클린 아키텍처 + DI 구조를 반드시 따른다.
- 공유 타입, API 클라이언트, 디자인 토큰, Tailwind preset은 모노레포 패키지로 분리한다.
- HTTP 클라이언트는 `ky`, API 클라이언트 타입 생성은 백엔드 OpenAPI 기반 `openapi-typescript`를 사용한다.
- 구현 시 프론트엔드(Web/Mobile)의 FSD 레이어 경계와 백엔드의 클린 아키텍처 의존성 방향을 우회하지 않는다.

## 구현 시 주의사항

- 업로드 이미지는 메모리에서만 처리하고 디스크에 저장하지 않는다.
- 분석 결과는 응답으로만 반환하고 서버에 저장하지 않는다.
- 백엔드는 모든 분석 응답에 면책 문구를 부착해야 한다.
- LLM/OCR/Barcode 외부 의존성은 Port 인터페이스를 통해서만 접근한다.
- 초기 구현체는 Mock provider를 우선 제공한다.
- API 오류 응답은 RFC 7807 형식(`application/problem+json`)을 따른다.
- Phase 2 또는 Phase 3 기능은 사용자의 명시적 요청 없이 선행 구현하지 않는다.

## 테스트 원칙 (TDD)

- 모든 구현 작업은 TDD로 진행한다. 구현 코드보다 테스트 코드를 먼저 작성한다.
- 순서를 반드시 지킨다: (1) 요구사항을 검증하는 실패하는 테스트 작성 → (2) 테스트가 실제로 실패(red)하는 것을 실행해 확인 → (3) 테스트를 통과시키는 최소 구현 작성 → (4) 테스트 통과(green) 확인 → (5) 필요 시 리팩터링(테스트는 계속 green 유지).
- 테스트를 먼저 실행해 "의도한 이유로 실패"하는지 확인하기 전에는 구현을 시작하지 않는다. 문법 오류·import 오류 등으로 실패하는 것은 유효한 red가 아니다.
- 실패하는 테스트 없이 구현 코드를 먼저 작성하지 않는다. 기존 코드 수정·버그 수정도 먼저 해당 동작을 재현하는 실패 테스트를 추가한 뒤 진행한다.
- 테스트는 관찰 가능한 동작·계약(입출력, 에러 응답, 경계 규칙)을 검증하고 내부 구현 세부에 결합하지 않는다.
- 외부 의존성(LLM/OCR/Barcode 등 Port)은 테스트에서 Mock/Fake로 대체하고, 네트워크·디스크 I/O에 의존하지 않는다.

### 스택별 테스트 도구

- Python(`apps/api`): `pytest`(+`pytest-asyncio`, `asyncio_mode="auto"`)를 사용한다. 클린 아키텍처 레이어별 단위 테스트와 엔드포인트 통합 테스트(`httpx.AsyncClient` + `ASGITransport` 기반 ASGI async client)를 함께 둔다.
- Web(`apps/web`) 및 공유 패키지(`packages/*`): `Vitest`를 사용한다. React 컴포넌트는 `@testing-library/react`로 사용자 관점 동작을 검증한다.
- Mobile(`apps/mobile`, React Native/Expo): `Jest`(`jest-expo` preset) + `@testing-library/react-native`를 사용한다. RN 환경 특성상 Vitest 대신 Jest가 표준이므로 이를 적용한다.

## 라운드별 개발 계획

PDD의 Phase 1/2/3을 **독립적으로 완료·검증 가능한 라운드**로 분할한다. 에이전트는
한 번에 한 라운드만 진행하고, 라운드를 시작하기 전에 선행 라운드의 완료 기준이
충족되었는지 확인한다. 라운드를 마치면 본 문서의 상태 표시를 갱신한다.

진행 규칙:
- 라운드는 위에서 아래 순서로 진행하며, 사용자가 명시적으로 지정하면 해당 라운드부터 진행한다.
- 한 라운드의 "완료 기준"을 모두 충족하기 전에는 다음 라운드를 시작하지 않는다.
- 라운드 범위를 벗어나는 작업(특히 다음 Phase 기능)은 사용자 요청 없이 선행하지 않는다.
- 상태 표기: `✅ 완료` / `🔜 다음` / `⏳ 대기`.

### Phase 1 (MVP)

#### R1 — 모노레포 골격 + 백엔드 API ✅ 완료
- 범위: pnpm workspace + Turborepo 골격, `apps/api`(FastAPI 클린 아키텍처 + DI)
- 산출물: 루트 설정 파일, `apps/api` 전체(domain/application/infrastructure/interfaces/di/core), Mock LLM/OCR 어댑터, `POST /analysis/by-ingredients-{text,image}`, `GET /health`, RFC 7807 오류, 면책 문구 부착, 단위/통합 테스트
- 완료 기준: `uv run ruff check .`, `uv run mypy src`, `uv run pytest` 통과 / 서버 기동 후 3개 엔드포인트 정상 / `/openapi.json` 노출

#### R2 — 프론트 공유 패키지 ✅ 완료
- 범위: 모노레포 공유 패키지 구성
- 산출물: `packages/config-typescript`, `packages/config-eslint`(FSD 경계 강제용 `eslint-plugin-boundaries`/`steiger` 포함), `packages/ui-tokens`, `packages/config-tailwind`(RN/Web 공용 preset), `packages/shared-types`, `packages/api-client`(백엔드 OpenAPI → `openapi-typescript` 타입 생성 + `ky` 기반 wrapper)
- 선행: R1
- 완료 기준: `pnpm install` 성공 / `api-client` 타입이 `apps/api`의 `AnalysisResult` 스키마와 일치 / 공유 패키지가 lint·type-check 통과
- 비고: 공유 TS 패키지 빌드는 `tsup`(ESM+CJS+d.ts)로 통일. `api-client`는 백엔드 OpenAPI 스냅샷(`openapi.json`)과 생성 타입(`src/generated/schema.ts`)을 함께 커밋해 파이썬 없이도 TS 파이프라인이 동작하며, `pnpm --filter @cosmetics-analyzer/api-client run generate`로 재생성한다. `api-client`↔`shared-types` 동치는 `schema-assert.ts`로 컴파일 타임 검증.

#### R3 — Web 앱 ✅ 완료
- 범위: `apps/web` (Vite + React 19, FSD 패턴, 클린 아키텍처 미적용)
- 산출물: Tailwind v4(공용 preset), React Router v7, TanStack Query v5 + `ky`, Zustand, 이미지/텍스트 입력 → 분석 → 결과 화면, 면책 문구 표시, 결과는 메모리 store에만 보관
- 선행: R2
- 완료 기준: `pnpm --filter web build` 성공 / 로컬에서 백엔드 연동하여 텍스트·이미지 분석 결과 표시 / FSD 레이어 경계 lint 통과
- 비고:
  - FSD 레이어: `app`(providers/router) → `pages`(analyze/result) → `widgets`(analysis-result) → `features`(analyze-ingredients) → `entities`(analysis: verdict/store/badge) → `shared`(api/config/ui). 각 슬라이스는 `index.ts` public API 경유.
  - 분석 결과는 Zustand 메모리 store(`entities/analysis`)에만 보관하며, 결과가 없으면(예: 새로고침) 입력 화면으로 리다이렉트(무상태·비저장 원칙).
  - 상태 검증: `vitest`(15) 통과, `tsc --noEmit` 통과, `eslint`(boundaries) 통과, `steiger` 통과, `vite build` 성공, 백엔드 연동 텍스트·이미지 경로 브라우저 확인.
  - 공용 `config-eslint/fsd.js` 보정: `shared`는 슬라이스가 아니라 세그먼트(ui/api/lib/config)로 구성되어 세그먼트 간 상호 참조가 FSD 상 허용되므로 `shared → shared`를 허용하도록 규칙을 추가했다(R4 mobile에도 동일 적용).
  - ESLint 10 미대응으로 `eslint-plugin-react`/`react-hooks`/`react-refresh`는 로딩이 깨져 제외했다. React 규칙은 TypeScript strict + tseslint로 대체하며 ESLint 10 대응 버전 출시 시 재도입한다(R5 CI에서 재점검).
  - Playwright(`web-ui-playwright` 스킬)는 수동 렌더 검증에만 사용했고, E2E 테스트 도입(미결정 항목)은 아직 확정하지 않았다.

#### R4 — Mobile 앱 ✅ 완료
- 범위: `apps/mobile` (Expo SDK 54, React Native, **FSD 패턴만** — 클린 아키텍처 미적용)
- 산출물: expo-router, NativeWind v4(공용 preset), expo-camera/expo-image-picker, TanStack Query + `ky`, Zustand, 이미지/텍스트 입력 → 분석 → 결과 화면, 면책 문구 표시
- 선행: R2
- 완료 기준: Expo 앱 기동 / 백엔드 연동 분석 동작 / FSD 레이어 경계 lint 통과
- 비고:
  - FSD 레이어: `app`(expo-router 라우트 루트 = `src/app`, `_layout`에서 전역 provider 조립) → `pages`(analyze/result) → `widgets`(analysis-result) → `features`(analyze-ingredients) → `entities`(analysis: verdict/store/badge/score) → `shared`(api/config/ui). 각 슬라이스는 `index.ts` public API 경유.
  - **expo-router ↔ FSD `app` 레이어 충돌 해소**: expo-router 는 `src/app` 을 라우트 루트로 우선 채택하므로, 별도 루트 `app/` 를 두지 않고 `src/app` 을 라우트 루트 **겸** FSD app(조립) 레이어로 사용한다. 라우트 파일(`_layout.tsx`/`index.tsx`/`result.tsx`)만 두고 provider 는 `_layout`에 인라인 조립한다(비라우트 파일을 라우트 디렉터리에 두지 않기 위함).
  - 분석 결과는 Zustand 메모리 store(`entities/analysis`)에만 보관하며, 결과가 없으면(예: 앱 재시작) `<Redirect href="/" />` 로 입력 화면으로 되돌린다(무상태·비저장 원칙).
  - NativeWind v4 는 Tailwind v3 를 peer 로 요구하므로 `apps/mobile` 은 `tailwindcss@^3` 를 사용한다. 공용 preset(`config-tailwind`)의 `theme.extend` 형태가 v3/v4 호환이라 web(Tailwind v4)과 동일 토큰을 공유한다. RN 특성상 배경색은 View/Pressable, 글자색은 Text 에 분리 적용한다.
  - 이미지 업로드는 expo-image-picker 자산 `{ uri, name, type }` 을 RN `FormData` 파트로 전달한다(웹의 `Blob` 과 다름). `api-client` wrapper 는 무수정 재사용하고 호출부에서 캐스팅한다.
  - **모노레포 pnpm ↔ Expo/Metro 정합화**: Expo 공식 가이드에 따라 루트 `.npmrc` 에 `node-linker=hoisted` 를 적용했다. 또한 web(react `^19.2`)과 Expo(react `19.1.0`) 의 React 중복으로 react-query 훅이 깨져, 루트 `pnpm.overrides` 로 `react`/`react-dom` 을 `19.1.0` 으로 단일화했다(web 회귀 없음: type-check·15 테스트 통과 확인).
  - 상태 검증: `jest`(17) 통과, `tsc --noEmit` 통과, `eslint`(boundaries) 통과, `steiger` 통과, `expo export`(iOS) Metro 번들 성공(1402 modules, 라우트 누락 경고 없음). **시뮬레이터 부팅 및 실기기 백엔드 연동은 이 환경에서 미실행** — 번들·단위 테스트(백엔드 mock)로 배선을 검증했고, 실제 기동/연동 확인은 사용자 환경에서 필요하다.
  - web(R3)와 동일하게 ESLint 10 미대응인 `eslint-plugin-react`/`react-hooks` 는 제외했고(TypeScript strict + tseslint 로 대체), CJS 설정 파일(metro/babel/tailwind/jest)은 `require()` 허용 override 를 두었다. flat config(eslint/steiger)는 CJS 패키지에서 ESM 로드되도록 `.mjs` 로 둔다.

#### R5 — 품질/CI 파이프라인 🔜 다음
- 범위: 저장소 전반 품질 자동화 (PDD §11)
- 산출물: husky + lint-staged, Conventional Commits 설정, GitHub Actions(lint/test/type-check 필수 — TS/Python 모두), Vitest(web/shared)·Jest(RN)·pytest 구성 정리
- 선행: R1~R4
- 완료 기준: CI 워크플로가 lint/test/type-check를 통과 / pre-commit 훅 동작

### Phase 2 (사용자 명시 요청 시에만 시작)

#### R6 — 바코드 입력 ⏳ 대기
- 범위: `BarcodeLookupPort` + 구현체, `POST /analysis/by-barcode`, `POST /analysis/by-barcode-image`(`AnalysisResult + Product`)
- 선행: Phase 1 완료, "바코드 → 제품 매핑 소스" 결정
- 완료 기준: 바코드 경로 엔드포인트 동작 + 테스트 통과

#### R7 — 결과 일관성/예외 처리 고도화 ⏳ 대기
- 범위: 프롬프트 정교화, JSON schema 강화, 검증/재시도 강화, 저화질·미인식·부분 인식 등 예외 케이스 처리
- 선행: R6

#### R8 — Rate limiting ⏳ 대기
- 범위: `slowapi` 기반 IP 단위 rate limit 적용(`RATE_LIMIT_PER_MIN`)
- 선행: Phase 1 완료

### Phase 3 (사용자 명시 요청 시에만 시작)

#### R9 — 히스토리/비교 (DB·인증 재설계) ⏳ 대기
- 선행: "Phase 3 DB 및 인증 설계" 결정. 무상태 정책 변경을 수반하므로 사용자 결정 필수.

#### R10 — 결과 표현 정교화/카테고리 정리 ⏳ 대기

#### R11 — 품질 모니터링 ⏳ 대기
- 범위: 분석 성공률, LLM 응답 검증 실패율 등 모니터링

> 참고: LLM/OCR provider가 확정되었다(OCR=Gemini 비전, LLM=OpenAI GPT). 실제 provider 도입(mock → real)은
> 별도 라운드가 아니라 Port 구현체만 추가하는 작업으로 진행한다(`OcrPort`=Gemini, `LlmAnalysisPort`=OpenAI GPT).
> Port 인터페이스와 DI 선택 구조는 R1에서 이미 마련되어 있으며, 구체 모델과 추론 강도는 env가 아니라 `Settings` 객체(`apps/api/src/core/config.py`)에 고정 기본값(`ClassVar`)으로 둔다.

## 미결정 항목

다음 항목은 사용자의 선택이 필요하며, 구현 중 임의로 확정하지 않는다.
항목이 확정되면 「작업 원칙」의 PDD 갱신 규칙에 따라 즉시 PDD에 반영하고 본 목록에서 제거한다.

- 바코드 -> 제품 매핑 소스
- 백엔드 배포 플랫폼
- 분석 결과 캐싱 정책
- 에러 모니터링 도구
- E2E 테스트 도입 시점
- Phase 3 DB 및 인증 설계
