# 라운드별 개발 계획 / 진행 상황

> 이 문서는 `AGENTS.md`에서 분리된 **진행 상황 추적 문서**다. 불변 지침(역할·작업
> 원칙·아키텍처·구현 주의사항·테스트 원칙)은 `AGENTS.md`에 있고, 이 문서는 라운드
> 계획·상태·완료 내역과 미결정 항목을 담는다.
>
> - **작업을 시작하기 전에** 이 문서에서 현재 라운드·선행 조건·완료 기준을 반드시 확인한다.
> - **라운드를 마치면** 이 문서의 상태 표기(✅/🔄/🔜/⏳)와 비고를 갱신한다.
> - 「미결정 항목」이 확정되면 `AGENTS.md`의 PDD 갱신 규칙에 따라 PDD에 반영하고 이 문서의 목록에서 제거한다.

## 라운드별 개발 계획

PDD의 Phase 1/2/3을 **독립적으로 완료·검증 가능한 라운드**로 분할한다. 에이전트는
한 번에 한 라운드만 진행하고, 라운드를 시작하기 전에 선행 라운드의 완료 기준이
충족되었는지 확인한다. 라운드를 마치면 본 문서의 상태 표시를 갱신한다.

진행 규칙:
- 라운드는 위에서 아래 순서로 진행하며, 사용자가 명시적으로 지정하면 해당 라운드부터 진행한다.
- 한 라운드의 "완료 기준"을 모두 충족하기 전에는 다음 라운드를 시작하지 않는다.
- 라운드 범위를 벗어나는 작업(특히 다음 Phase 기능)은 사용자 요청 없이 선행하지 않는다.
- 상태 표기: `✅ 완료` / `🔄 진행중` / `🔜 다음` / `⏳ 대기`.

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
  - R5 재점검에서 ESLint 10 호환이 확인된 `eslint-plugin-react-hooks`/`react-refresh`는 재도입했다. `eslint-plugin-react` 7.37.5는 peer 범위가 ESLint 9까지라 계속 제외하며 React 기본 검사는 TypeScript strict + tseslint로 보완한다.
  - Playwright(`web-ui-playwright` 스킬)는 수동 렌더 검증에만 사용했고, E2E 테스트 도입(미결정 항목)은 아직 확정하지 않았다.

#### R4 — Mobile 앱 ✅ 완료
- 범위: `apps/mobile` (Expo SDK 54, React Native, **FSD 패턴만** — 클린 아키텍처 미적용)
- 산출물: expo-router, NativeWind v4(공용 preset), expo-camera/expo-image-picker, TanStack Query + `ky`, Zustand, 카메라 촬영(메인)/이미지 업로드/텍스트 입력 → 분석 → 결과 화면, 면책 문구 표시
- 선행: R2
- 완료 기준: Expo 앱 기동 / 백엔드 연동 분석 동작 / FSD 레이어 경계 lint 통과
- 비고:
  - FSD 레이어: `app`(expo-router 라우트 루트 = `src/app`, `_layout`에서 전역 provider 조립) → `pages`(analyze/result) → `widgets`(analysis-result) → `features`(analyze-ingredients) → `entities`(analysis: verdict/store/badge/score) → `shared`(api/config/ui). 각 슬라이스는 `index.ts` public API 경유.
  - **expo-router ↔ FSD `app` 레이어 충돌 해소**: expo-router 는 `src/app` 을 라우트 루트로 우선 채택하므로, 별도 루트 `app/` 를 두지 않고 `src/app` 을 라우트 루트 **겸** FSD app(조립) 레이어로 사용한다. 라우트 파일(`_layout.tsx`/`index.tsx`/`result.tsx`)만 두고 provider 는 `_layout`에 인라인 조립한다(비라우트 파일을 라우트 디렉터리에 두지 않기 위함).
  - 분석 결과는 Zustand 메모리 store(`entities/analysis`)에만 보관하며, 결과가 없으면(예: 앱 재시작) `<Redirect href="/" />` 로 입력 화면으로 되돌린다(무상태·비저장 원칙).
  - NativeWind v4 는 Tailwind v3 를 peer 로 요구하므로 `apps/mobile` 은 `tailwindcss@^3` 를 사용한다. 공용 preset(`config-tailwind`)의 `theme.extend` 형태가 v3/v4 호환이라 web(Tailwind v4)과 동일 토큰을 공유한다. RN 특성상 배경색은 View/Pressable, 글자색은 Text 에 분리 적용한다.
  - **카메라 촬영이 메인 입력**(사용자 결정, 근거: 모바일에서 전성분 표시면을 즉석 촬영하는 흐름이 1차 진입점): `features/analyze-ingredients`의 `CameraCapture`가 `expo-camera` `CameraView` 라이브 프리뷰를 히어로로 띄우고 셔터로 `takePictureAsync` → `{ uri, name, type }` 이미지로 이미지 분석 경로 재사용. 이미지 업로드/텍스트 입력은 보조 모드(mode: `camera`(기본) | `upload` | `text`). 권한 미허용 시 프리뷰 대신 `useCameraPermissions` 기반 권한 요청 UI 표시. 앱 진입 화면(`AnalyzePage`)은 ScrollView 대신 flex 컬럼으로 바꿔 프리뷰가 화면을 채운다.
  - 이미지 업로드는 expo-image-picker 자산 `{ uri, name, type }` 을 RN `FormData` 파트로 전달한다(웹의 `Blob` 과 다름). `api-client` wrapper 는 무수정 재사용하고 호출부에서 캐스팅한다. 카메라 촬영도 동일 `{ uri, name, type }` 형태로 같은 경로를 탄다.
  - **모노레포 pnpm ↔ Expo/Metro 정합화**: Expo 공식 가이드에 따라 루트 `.npmrc` 에 `node-linker=hoisted` 를 적용했다. React 중복으로 react-query 훅이 깨지지 않도록 Web/Mobile 선언과 루트 `pnpm.overrides`의 `react`/`react-dom`을 Expo 요구 버전 `19.1.0`으로 단일화했다(web 회귀 없음: type-check·15 테스트 통과 확인).
  - 상태 검증: `jest`(20, 카메라 촬영 3케이스 포함) 통과, `eslint`(boundaries) 통과, `steiger` 통과, `expo export`(iOS) Metro 번들 성공(라우트 누락 경고 없음). **시뮬레이터 부팅 및 실기기 연동은 이 환경에서 미실행** — 특히 **카메라 라이브 프리뷰/셔터는 시뮬레이터에 카메라 하드웨어가 없어 실기기 확인이 필수**다. 번들·단위 테스트(카메라 네이티브 모듈 mock)로 배선을 검증했다.
  - 카메라 테스트는 `expo-camera`를 mock 하며, `CameraView` mock 은 RN host 컴포넌트를 렌더하면 nativewind babel 변환과 충돌하므로 `null` 을 반환하고 `ref` 로 `takePictureAsync` 만 노출한다. `camera-view` testID 는 실제 컴포넌트의 프리뷰 래퍼에 둔다.
  - R5에서 `global.css` side-effect import 선언(`global.d.ts`)을 추가해 `tsc --noEmit` TS2882를 해소했다.
  - R5 재점검에서 ESLint 10 호환이 확인된 `eslint-plugin-react-hooks`는 재도입했다. `eslint-plugin-react` 7.37.5는 peer 범위가 ESLint 9까지라 계속 제외한다. CJS 설정 파일(metro/babel/tailwind/jest)은 `require()` 허용 override 를 두었고, flat config(eslint/steiger)는 CJS 패키지에서 ESM 로드되도록 `.mjs` 로 둔다.

#### R5 — 품질/CI 파이프라인 ✅ 완료
- 범위: 저장소 전반 품질 자동화 (PDD §11)
- 산출물: husky + lint-staged, Conventional Commits 설정, GitHub Actions(lint/test/type-check 필수 — TS/Python 모두), Vitest(web/shared)·Jest(RN)·pytest 구성 정리
- 선행: R1~R4
- 완료 기준: CI 워크플로가 lint/test/type-check를 통과 / pre-commit 훅 동작
- 비고(완료 내역):
  - **CI 품질 게이트 완성**: 모노레포 경로 기반 선택 실행을 적용했다. 트리거 브랜치는 **`main`** 이다(사용자 결정, 2026-07-22 변경: 기존 `prod` 트리거를 `main` push 로 전환하고 `prod` 브랜치는 제거. 근거: trunk-based 개발이므로 배포/CI 기준 브랜치를 trunk(`main`)으로 단일화). 이때 `dorny/paths-filter` 에는 반드시 `base: ${{ github.event.before }}` 를 지정한다 — `base` 미지정 시 기본 브랜치의 merge-base 를 기준으로 삼는데, 트리거 브랜치가 곧 기본 브랜치(`main`)이면 비교 대상이 자기 자신이 되어 항상 "변경 없음"으로 모든 job 이 skip 되기 때문이다(직전 커밋 대비로 감지하도록 고정). PR 이벤트에서는 이 `base` 가 무시되고 PR base 브랜치가 사용된다.
    - `.github/workflows/ci.yml`: `quality-config` job은 경로와 무관하게 저장소 품질 설정을 검증한다. `changes` job(`dorny/paths-filter`)은 web/mobile/api/shared 변경을 감지하고, 각 앱 job은 자기 경로 변경 또는 `shared`(루트 파일·`packages/**`) 변경 시 실행한다. 앱 job은 turbo `--filter`(web/mobile)·`lint:fsd`(steiger)·mobile `expo export` 스모크, `packages` job(shared 시 `--filter=./packages/*`), `api` job(uv `sync`/`ruff`/`mypy`/`pytest`)을 수행한다. node `.nvmrc`(22), pnpm 10.28.0. 트리거: PR + `main` push.
    - `actionlint` 1.7.12로 `ci.yml`/`mobile-cd.yml` 문법 검증 통과. `pnpm install --frozen-lockfile`과 CI 상당 명령을 로컬에서 모두 통과했다: Web Vitest 15, Mobile Jest 20, shared Vitest 2, API pytest 45, TS/Python lint·type-check, Web/Mobile FSD steiger, Expo iOS export.
  - **로컬 훅 완성**: husky `prepare`, lint-staged, commitlint Conventional 설정을 추가했다. pre-commit은 Web/Mobile/packages ESLint, API ruff check/format, 공통 Prettier를 staged 파일에만 적용한다. 격리 Git 인덱스에서 pre-commit 성공을 확인했고, commit-msg는 유효한 `chore:` 메시지를 통과시키고 비규약 메시지를 거부한다.
  - **테스트/타입/린트 구성 정리**: 품질 설정 계약 테스트 9개와 `shared-types` Vitest 2개를 추가했다. PDD의 TypeScript 5.x와 Expo React 19.1 계약에 맞춰 workspace 선언을 TypeScript 5.9.3/React 19.1로 정렬하고 peer 경고를 제거했으며, TS6 전용 `ignoreDeprecations: "6.0"` 옵션과 프로젝트 tsconfig의 `baseUrl`도 제거했다. Mobile CSS 선언 누락을 해소했고, Jest의 React Query mutation GC 타이머를 비활성화해 테스트 종료 hang을 제거했다. pnpm hoisted 환경에서 Zod v3/v4가 섞이지 않도록 React Hooks 하위 의존성을 v4로 고정해 Web type-check와 Hooks 로딩을 복구했다. `eslint-plugin-boundaries` v6의 `boundaries/dependencies` 객체 selector로 이전해 deprecated 경고를 제거하고 public API 경계를 유지한다.
  - **R5 완료 확인(2026-07-15)**: `prod` 브랜치를 생성하고 R5 구현 커밋 `4af617d`를 push했다. GitHub Actions CI 실행 `29418818832`에서 `quality config`, `Detect changes`, packages, Web, Mobile, API 6개 job이 모두 green으로 완료되어 R5 완료 기준을 충족했다.
  - **모바일 CD는 별도 초안**: 모바일이 Expo Managed(네이티브 폴더 없음)라 EAS Build/Submit 경로를 기준으로 작성했으며, R5-CD2에서 실동작을 완성한다. R5-CD2 자격증명과 projectId가 준비되기 전에는 `main` push에서 실패하지 않도록 `workflow_dispatch` 수동 실행만 허용한다.
    - `.github/workflows/mobile-cd.yml`: R5-CD2에서 `main` push 트리거를 활성화하면 `changes`(paths-filter, `base: ${{ github.event.before }}`)로 모바일 영향/네이티브 변경 감지 → `decide` job 이 분기한다. **네이티브 변경(apps/mobile/package.json·app.json·eas.json, pnpm-lock.yaml) O → `eas build`+`eas submit`, X → `eas update`(OTA)**, 모바일 무관 → 실행 안 함. 현재 수동(`workflow_dispatch`)은 `mode`(auto/ota/build-submit)로 강제 가능(auto+수동은 OTA). `expo/expo-github-action`+`EXPO_TOKEN` 인증.
    - `apps/mobile/eas.json`: development/preview/production build 프로파일 + submit 프로파일 초안(자격증명 자리 플레이스홀더).
    - `apps/mobile/app.json`: EAS 빌드에 필수인 `ios.bundleIdentifier`/`android.package` 를 플레이스홀더(`com.cosmeticsanalyzer.app`)로 추가 — **실제 값으로 교체 필요**.
  - **배포(CD)는 R5 범위에서 분리**(사용자 결정, 근거: R5 는 문서상 "CI 품질 게이트 + 로컬 훅"까지가 범위이고 배포는 별개 인프라 작업이며 배포 플랫폼이 미결정 항목이라 라운드로 분리 추적한다): 위 `mobile-cd.yml`/`eas.json`/`app.json` 초안과 실 자격증명·`eas init` 작업은 신설 **R5-CD2(모바일 배포)** 로 이관해 추적한다. 웹/백엔드 배포 CD 는 신설 **R5-CD1(웹/백엔드 배포)** 로 다룬다. R5 자체 완료 기준은 CI 품질 게이트 green + 로컬 훅으로 한정한다.
  - CI/CD 실행 자격증명·시크릿의 **실제 값**은 GitHub Actions Secrets/Variables 로만 참조한다. 필요한 항목: Secret `EXPO_TOKEN`, Variable `EXPO_PUBLIC_API_BASE_URL`. 다만 로컬 개발용 `.env` 에는 워크플로가 참조하는 변수를 **플레이스홀더(`<...>`)로** 문서화해 둔다(사용자 결정, 2026-07-15, 근거: 워크플로가 어떤 변수를 쓰는지 로컬에서도 한눈에 파악·주입할 수 있게 함). 실제 시크릿 값은 여전히 `.env` 에 넣지 않으며, `apps/mobile/.env` 는 gitignore 대상이라 커밋되지 않는다. 현재 `apps/mobile/.env`(및 `.env.example`)에 `EXPO_TOKEN=<expo-access-token>` 플레이스홀더를 추가했다.
  - ESLint 10 재점검 결과 `react-hooks` 7.1.1과 `react-refresh` 0.4.26은 재도입했고, peer 범위가 ESLint 9까지인 `eslint-plugin-react` 7.37.5만 제외 상태다.

#### R5-CD1 — 웹/백엔드 배포(CD) ✅ 완료
- 범위: `apps/web` 정적 배포 + `apps/api` 컨테이너 배포 CD 워크플로 (`main` push 트리거, CI 와 동일한 경로 기반 선택 실행)
- 산출물: `.github/workflows/web-cd.yml`(정적 호스팅 배포), `.github/workflows/api-cd.yml`(Docker 이미지 빌드 → 배포 플랫폼). 자격증명·시크릿의 **실제 값**은 `.env` 등 파일로 만들지 않고 GitHub Actions Secrets/Variables 로만 참조한다.
- 선행: R5 완료, ~~웹 배포 플랫폼 결정~~(확정: **AWS S3 + CloudFront**, 2026-07-18), ~~백엔드 배포 플랫폼 결정~~(확정: **Docker/GHCR → SSH 자체 서버**, 2026-07-18)
- 완료 기준: `main` push 시 웹·백엔드 CD 가 실제 배포까지 성공(green)
- 비고(완료 내역):
  - **플랫폼 결정(사용자, 2026-07-18)**: 웹=AWS **S3**(정적 호스팅) + **CloudFront**(edge/CDN), 백엔드=Docker 이미지를 **GHCR** push 후 **자체 서버에 SSH pull/run**. 근거: 사용자가 자체 서버(호스트/ssh키) 기반 백엔드 배포와 S3+CloudFront edge 웹 배포를 지정. 두 항목은 미결정 목록에서 제거하고 PDD §2.6·§15·CD 표에 반영했다.
  - **웹 CD**(`web-cd.yml`): `main` push(경로 diff, `base: ${{ github.event.before }}`) + `workflow_dispatch`. `pnpm turbo run build --filter=web` → `aws s3 sync apps/web/dist`(에셋 immutable 캐시, `index.html` no-cache 분리) → `aws cloudfront create-invalidation --paths "/*"`. AWS 자격증명은 `aws-actions/configure-aws-credentials`(access key 시크릿).
  - **백엔드 CD**(`api-cd.yml`): `main` push(경로 diff, `base: ${{ github.event.before }}`) + `workflow_dispatch`. `docker/build-push-action` 으로 `apps/api/Dockerfile` 빌드 → GHCR(`ghcr.io/<owner>/api:<sha>`, `:latest`) push(실행 시 유효한 `GITHUB_TOKEN` 인증, 별도 레지스트리 시크릿 불필요) → `appleboy/ssh-action` 으로 자체 서버 접속해 pull/run(`docker run --restart unless-stopped --network proxy_net --env-file <임시파일>`). **런타임 운영값·시크릿은 서버에 미리 둔 파일(API_ENV_FILE)이 아니라 GitHub Secrets/Variables 에서 배포 시점에 주입**한다(사용자 결정, 근거: 서버 env-file 사전 배치는 오버엔지니어링): 배포 스크립트가 `ENV=prod` + `LLM_PROVIDER`(vars, 기본 openai)/`OCR_PROVIDER`(vars, 기본 gemini)/`CORS_ORIGINS`(vars)/`LLM_API_KEY`·`OCR_API_KEY`(secrets)로 임시 env-file 을 만들어 컨테이너에 주입하고 생성 직후 삭제한다. 레포 `.env`(dev 서버용)·`config.py` 기본값은 dev/mock 유지.
  - **공용 nginx 연동**(사용자 지시): API 를 새 nginx 로 감싸지 않고 **서버에 이미 떠 있는 공용 nginx** 에 편입한다. 배포 스크립트가 공용 conf.d(`~/nginx/conf.d`)에 이 앱 전용 `cosmetics-api.conf`(server 블록: `listen 8000 ssl`, `server_name api.agentops.p-e.kr`, `proxy_pass http://cosmetics-api:8000`) 만 추가하고, 컨테이너를 공용 `proxy_net` 에 join 시킨 뒤 공용 nginx 를 재시작이 아니라 `nginx -t && nginx -s reload` 로 **무중단 reload** 한다(다른 앱 설정 미변경). 공개 노출은 nginx(8000/SSL)가 담당하므로 백엔드 컨테이너는 호스트 포트를 직접 게시하지 않는다. 도메인·인증서 경로·`nginx_container`/conf.d/`proxy_net` 은 서버 고정값이라 워크플로 상수로 둔다(전제: 공용 nginx 컨테이너가 호스트 8000 을 게시하고 `/etc/letsencrypt/live/api.agentops.p-e.kr/` 인증서 준비).
  - **플레이스홀더 처리(사용자 지시)**: 호스트·SSH키·AWS 자격증명 등 모르는 값은 워크플로에 literal 로 두지 않고 `${{ secrets.* }}`/`${{ vars.* }}` 참조로만 두었다. 로컬 `.env`/`.env.example`(`apps/web`, `apps/api`)에는 워크플로가 참조하는 변수를 `<...>` 플레이스홀더로 문서화했다(실제 값은 넣지 않음). 사용자가 GitHub 에 등록해야 하는 값: Secret `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`·`DEPLOY_SSH_HOST`/`DEPLOY_SSH_USER`/`DEPLOY_SSH_KEY`·`LLM_API_KEY`/`OCR_API_KEY`, Variable `AWS_REGION`/`WEB_S3_BUCKET`/`CLOUDFRONT_DISTRIBUTION_ID`/`VITE_API_BASE_URL`/`DEPLOY_SSH_PORT`/`LLM_PROVIDER`/`OCR_PROVIDER`/`CORS_ORIGINS`. 백엔드 운영 런타임값은 서버 env-file 사전 배치 없이 이 Secrets/Variables 로 배포 시 주입한다. nginx 도메인·인증서 경로·컨테이너/네트워크명은 서버 고정값이라 워크플로 상수로 처리하므로 별도 변수 등록이 불필요하다. 서버에는 공용 nginx 컨테이너(호스트 8000 게시)와 `/etc/letsencrypt/live/api.agentops.p-e.kr/` 인증서가 미리 준비돼 있어야 한다.
  - **상태 검증**: 품질 계약 테스트 4개 추가(웹/백엔드 CD 트리거·핵심 스텝·시크릿 참조·literal 자격증명 금지·`.env` 플레이스홀더) → `pnpm test:quality` 13개 green. `actionlint` 1.7.12 로 두 워크플로 문법 통과. `pnpm turbo run build --filter=web` 로 `apps/web/dist` 산출 확인. **실제 배포(main push green)는 사용자가 GitHub Secrets/Variables 와 서버(자체 서버·S3·CloudFront)를 준비한 뒤 검증해야 한다** — 이 환경에서는 자격증명·인프라 부재로 미실행.

#### R5-CD2 — 모바일 배포(CD) ⏳ 대기
- 범위: R5 에서 작성된 `mobile-cd.yml`(EAS build/submit/update, `main` push 시 네이티브 변경 여부로 분기) 초안을 실동작까지 완성
- 산출물: (초안 존재) `mobile-cd.yml`/`eas.json` 에 실 자격증명 연결, `eas init`(projectId) 설정, `app.json` 의 `ios.bundleIdentifier`/`android.package` 플레이스홀더(`com.cosmeticsanalyzer.app`)를 실제 값으로 교체
- 선행: R5 완료, EAS 자격증명 확보 — Secret `EXPO_TOKEN`·App Store Connect API Key·Google Play 서비스 계정, Variable `EXPO_PUBLIC_API_BASE_URL`
- 완료 기준: `main` push 시 네이티브 변경 여부에 따른 분기(OTA `eas update` vs `eas build`+`eas submit`)가 실제 동작

> 참고: R5-CD1/R5-CD2 는 Phase 1 산출물을 배포하기 위한 인프라 라운드로 R5 다음에 둔다. 다만 배포 플랫폼 결정·자격증명 확보에 의존하므로, 이들이 지연되면 Phase 2 기능 라운드(R6~)와 병행하거나 후행할 수 있다. Phase 2 기능 라운드는 배포(CD) 완료를 강제 선행으로 두지 않는다.

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
항목이 확정되면 `AGENTS.md` 「작업 원칙」의 PDD 갱신 규칙에 따라 즉시 PDD에 반영하고 본 목록에서 제거한다.

- 바코드 -> 제품 매핑 소스
- 분석 결과 캐싱 정책
- 에러 모니터링 도구
- E2E 테스트 도입 시점
- Phase 3 DB 및 인증 설계
