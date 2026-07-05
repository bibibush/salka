---
name: web-ui-playwright
description: Use when implementing or modifying UI in the web app (apps/web). Drives a real browser via the Playwright MCP server to load the running Vite dev server, inspect the rendered page, interact with it (click/type/navigate), take screenshots, and iterate until the UI is correct. Trigger on any web UI/component/styling/layout work under apps/web.
---

# Web UI 작업 (Playwright MCP)

`apps/web`의 UI를 구현하거나 수정할 때, 코드만 보고 추측하지 말고 **Playwright MCP로 실제 브라우저를 띄워 렌더 결과를 직접 확인하며** 작업한다.

## 언제 사용하나
- `apps/web`에서 컴포넌트/페이지/레이아웃/스타일을 새로 만들거나 고칠 때
- 시각적 회귀·정렬·반응형·상호작용(폼, 버튼, 네비게이션)을 검증해야 할 때

## 전제
- Playwright MCP 서버는 저장소 루트 `.mcp.json`의 `playwright`로 등록되어 있다.
- MCP 도구가 안 보이면 `/mcp`로 연결 상태를 확인한다. 브라우저 미설치 시 최초 실행에서 자동 설치된다(필요 시 `npx playwright install chromium`).

## 작업 흐름
1. **dev 서버 기동**: 백그라운드로 웹 dev 서버를 띄운다.
   - `pnpm --filter web dev` (Vite 기본 포트 `http://localhost:5173`)
   - 백엔드 연동이 필요한 화면이면 API 서버(`apps/api`)도 함께 기동한다.
2. **TDD 원칙 준수**: AGENTS.md에 따라 구현 전 실패하는 테스트(Vitest + Testing Library)를 먼저 작성한다. 브라우저 확인은 테스트를 대체하지 않고 보완한다.
3. **브라우저로 확인**: Playwright MCP 도구로 페이지를 열고 상태를 관찰한다.
   - `browser_navigate` 로 대상 URL 이동
   - `browser_snapshot` 으로 접근성 트리(구조) 확인 — 요소 식별에 우선 사용
   - `browser_take_screenshot` 으로 시각 확인
   - `browser_click` / `browser_type` / `browser_select_option` / `browser_hover` 로 상호작용
   - `browser_resize` 로 반응형(모바일/데스크톱 뷰포트) 확인
   - `browser_console_messages` 로 콘솔 에러 확인
4. **수정 → 재확인 루프**: 코드 수정 후 HMR 반영을 기다렸다가 스냅샷/스크린샷으로 재확인한다. 기대한 결과가 나올 때까지 반복한다.
5. **정리**: 작업이 끝나면 dev 서버 등 백그라운드 프로세스를 종료한다.

## 확인 포인트
- 면책 문구 등 정책상 필수 UI 요소가 실제로 렌더되는지 확인한다(AGENTS.md 구현 주의사항).
- 강한 단정 표현("유해/위험/안전")이 화면 문구에 노출되지 않는지 확인한다.
- FSD 레이어 경계를 우회하지 않는다. lint(`eslint-plugin-boundaries`/`steiger`)가 통과해야 한다.

## 완료 기준
- 변경한 화면이 브라우저에서 의도대로 렌더/동작함을 스크린샷·스냅샷으로 확인
- Vitest 테스트 및 FSD 경계 lint 통과
- `pnpm --filter web build` 성공
