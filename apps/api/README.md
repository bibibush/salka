# apps/api — Cosmetics Analyzer API

FastAPI 기반 백엔드. **클린 아키텍처 + DI**(dependency-injector) 구조를 따른다.
무상태(stateless)이며 인증·DB·영구 저장이 없다. 모든 분석 응답에는 면책 문구가 부착된다.

## 아키텍처

```
src/
├── domain/          # 순수 비즈니스 룰 (외부 의존 0)
├── application/     # use case, Port(추상), 서비스
├── infrastructure/  # Port 구현체 (mock LLM/OCR)
├── interfaces/      # FastAPI 라우터, Pydantic 스키마, 미들웨어
├── di/              # dependency-injector Container
└── core/            # 설정, 로깅
```

의존성 방향: `interfaces → application → domain`, `infrastructure → application → domain`.
외부 의존성(LLM/OCR)은 `application/ports`의 Port 인터페이스를 통해서만 접근하며, 구현체는 환경변수(`LLM_PROVIDER`, `OCR_PROVIDER`)로 선택해 DI 컨테이너가 주입한다. Phase 1은 mock 구현체만 제공한다.

## 실행

```bash
uv python pin 3.12
uv sync
cp .env.example .env

uv run uvicorn src.main:app --reload   # http://localhost:8000
```

## API (Phase 1)

| Method | Path | 입력 | 응답 |
| --- | --- | --- | --- |
| GET | `/health` | - | `{ "status": "ok" }` |
| POST | `/api/v1/analysis/by-ingredients-text` | `{ "ingredients": "..." }` | `AnalysisResult` |
| POST | `/api/v1/analysis/by-ingredients-image` | multipart `image` | `AnalysisResult` |

오류 응답은 RFC 7807(`application/problem+json`) 형식.

## 품질

```bash
uv run ruff check .
uv run mypy src
uv run pytest
```
