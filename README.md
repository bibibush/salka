# cosmetics-analyzer

화장품 바코드/전성분 이미지를 입력받아 LLM 기반으로 성분을 해석·스코어링하는 소비자용 **참고 도구**.
(의료/법적 판정 도구가 아니며, 모든 분석 결과에는 면책 문구가 포함된다.)

기준 문서: [`documents/pdd/pdd.md`](documents/pdd/pdd.md)

## 모노레포 구조

```text
cosmetics-analyzer/
├── apps/
│   ├── api/      # FastAPI 백엔드 (클린 아키텍처 + DI)
│   ├── web/      # Vite + React (FSD)          — 다음 라운드
│   └── mobile/   # Expo + React Native (FSD)   — 다음 라운드
├── packages/     # 공유 타입/토큰/config        — 다음 라운드
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

- 패키지 매니저: pnpm + workspaces
- 태스크 오케스트레이션: Turborepo
- Node 22 LTS / TypeScript 5.x (strict)

## 현재 구현 상태 (Phase 1 — 백엔드 우선)

`apps/api`만 구현되어 있다. 웹/모바일/공유 패키지는 다음 라운드에서 추가된다.

### 백엔드 실행 (`apps/api`)

```bash
cd apps/api
uv python pin 3.12
uv sync
uv run uvicorn src.main:app --reload   # http://localhost:8000
```

- API 문서: http://localhost:8000/docs
- OpenAPI 스키마: http://localhost:8000/openapi.json

자세한 내용은 [`apps/api/README.md`](apps/api/README.md) 참고.
