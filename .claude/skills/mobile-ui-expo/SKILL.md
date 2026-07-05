---
name: mobile-ui-expo
description: Use when implementing or modifying UI in the mobile app (apps/mobile, Expo/React Native). Drives the running app via the Expo MCP server to take simulator screenshots, tap views and find elements by testID, open React Native DevTools, and iterate until the screen is correct. Trigger on any mobile UI/screen/component/styling work under apps/mobile.
---

# Mobile UI 작업 (Expo MCP)

`apps/mobile`(Expo / React Native)의 UI를 구현하거나 수정할 때, **Expo MCP로 실행 중인 앱 화면을 직접 확인하고 조작하며** 작업한다.

## 언제 사용하나
- `apps/mobile`에서 화면/컴포넌트/레이아웃/스타일(NativeWind)을 새로 만들거나 고칠 때
- 시뮬레이터 렌더 결과, 탭 동작, 네비게이션(expo-router)을 검증해야 할 때

## 인증 (access token via OAuth)
- 원격 Expo MCP(`https://mcp.expo.dev/mcp`)는 **OAuth 방식으로만** 인증한다. `.mcp.json`에 `Authorization` 헤더를 직접 넣으면 OAuth 플로우와 충돌해 연결이 실패하므로 절대 넣지 않는다.
- 인증 절차(대화형 세션에서 1회):
  1. `/mcp` 실행 → `expo` 선택 → Authenticate
  2. OAuth 플로우 중에 발급한 **Personal access token**을 붙여넣는다(access token 방식, 권장). Expo 계정 → Access tokens에서 발급.
- `EXPO_TOKEN` 환경 변수(gitignore된 `.claude/settings.local.json`의 `env`)는 **원격 MCP 인증용이 아니라 로컬 dev 서버(`expo start`) 인증용**이다. 아래 "전제"의 로컬 기능에서 사용한다.
- MCP 도구가 안 보이거나 연결이 실패하면 `/mcp`로 상태를 확인하고 재인증한다.

## 전제 (local capabilities)
스크린샷·탭 등 **화면 조작 기능은 로컬 dev 서버가 떠 있어야** 활성화된다.
1. (최초 1회) 프로젝트에 dev 패키지 설치: `cd apps/mobile && npx expo install expo-mcp --dev`
2. dev 서버를 MCP 모드로 백그라운드 기동:
   `EXPO_UNSTABLE_MCP_SERVER=1 EXPO_TOKEN=$EXPO_TOKEN npx expo start`
   - iOS 시뮬레이터/Android 에뮬레이터 또는 Expo Go에서 앱을 연다.
3. **dev 서버를 재시작/중단할 때마다 MCP 서버를 재연결**해야 로컬 기능이 갱신된다(`/mcp`).

## 작업 흐름
1. **TDD 원칙 준수**: AGENTS.md에 따라 구현 전 실패하는 테스트(Jest `jest-expo` + `@testing-library/react-native`)를 먼저 작성한다. 화면 확인은 테스트를 대체하지 않고 보완한다.
2. **화면 확인**: Expo MCP 도구로 실행 중인 앱을 관찰·조작한다.
   - 시뮬레이터 **스크린샷**으로 현재 화면 확인
   - **testID로 요소 탐색 및 탭** — 상호작용 요소에는 `testID`를 부여해 조작을 안정화한다
   - **React Native DevTools** 열기로 상태/로그 확인
   - **expo-router sitemap** 생성으로 네비게이션 구조 확인
3. **수정 → 재확인 루프**: 코드 수정 후 Fast Refresh 반영을 기다렸다가 스크린샷으로 재확인한다. 기대 결과가 나올 때까지 반복한다.
4. **정리**: 작업이 끝나면 dev 서버 등 백그라운드 프로세스를 종료한다.

## 확인 포인트
- 면책 문구 등 정책상 필수 UI 요소가 실제 화면에 렌더되는지 확인한다(AGENTS.md 구현 주의사항).
- 강한 단정 표현("유해/위험/안전")이 화면 문구에 노출되지 않는지 확인한다.
- FSD 레이어 경계를 우회하지 않는다. 경계 lint가 통과해야 한다.

## 완료 기준
- 변경한 화면이 시뮬레이터에서 의도대로 렌더/동작함을 스크린샷으로 확인
- Jest 테스트 및 FSD 경계 lint 통과
- Expo 앱 정상 기동 및 백엔드 연동 분석 동작
