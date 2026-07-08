"""FastAPI 애플리케이션 팩토리.

앱 생성, DI 컨테이너 wiring, CORS/미들웨어, RFC 7807 예외 핸들러,
라우터 등록을 담당한다.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.config import Settings, get_settings
from src.core.logging import configure_logging, get_logger
from src.di.containers import Container
from src.domain.exceptions.domain_errors import (
    AnalysisValidationError,
    DomainError,
    EmptyIngredientsError,
    LlmAnalysisError,
    OcrExtractionError,
    ResponsePolicyError,
)
from src.interfaces.api.v1 import analysis_router, health_router
from src.interfaces.errors import ProblemException
from src.interfaces.schemas.problem import PROBLEM_JSON_MEDIA_TYPE, ProblemDetail

_logger = get_logger("app")

# 도메인 예외 → (HTTP status, 제목) 매핑 (PDD §7)
_DOMAIN_ERROR_MAP: dict[type[DomainError], tuple[int, str]] = {
    EmptyIngredientsError: (422, "분석할 성분이 없습니다"),
    OcrExtractionError: (422, "이미지에서 성분을 인식하지 못했습니다"),
    ResponsePolicyError: (502, "분석 결과 정책 위반"),
    LlmAnalysisError: (502, "분석 서비스 오류"),
    AnalysisValidationError: (502, "분석 결과 검증 실패"),
}
_FALLBACK_DOMAIN_ERROR = (500, "내부 서버 오류")


def _problem_response(
    request: Request,
    *,
    status: int,
    title: str,
    detail: str | None,
    type_: str = "about:blank",
) -> JSONResponse:
    problem = ProblemDetail(
        type=type_,
        title=title,
        status=status,
        detail=detail,
        instance=request.url.path,
    )
    return JSONResponse(
        status_code=status,
        content=problem.model_dump(),
        media_type=PROBLEM_JSON_MEDIA_TYPE,
    )


def _register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemException)
    async def _handle_problem(request: Request, exc: ProblemException) -> JSONResponse:
        return _problem_response(
            request,
            status=exc.status,
            title=exc.title,
            detail=exc.detail,
            type_=exc.type,
        )

    @app.exception_handler(DomainError)
    async def _handle_domain(request: Request, exc: DomainError) -> JSONResponse:
        status, title = _DOMAIN_ERROR_MAP.get(type(exc), _FALLBACK_DOMAIN_ERROR)
        if status >= 500:
            _logger.error("domain.error", error_type=type(exc).__name__)
        return _problem_response(request, status=status, title=title, detail=str(exc))

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return _problem_response(
            request,
            status=422,
            title="요청 검증 실패",
            detail="요청 형식이 올바르지 않습니다.",
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        _logger.error("unhandled.error", error_type=type(exc).__name__)
        return _problem_response(
            request,
            status=500,
            title="내부 서버 오류",
            detail="요청을 처리하는 중 예기치 못한 오류가 발생했습니다.",
        )


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(env=settings.env)

    container = Container()
    container.settings.override(settings)
    # 선택된 외부 provider(LLM/OCR)를 기동 시점에 즉시 구성해, API 키 누락 등
    # 설정 오류를 첫 요청이 아니라 앱 기동 시점에 조기 노출한다(fail-fast).
    container.llm_port()
    container.ocr_port()

    app = FastAPI(
        title="Cosmetics Analyzer API",
        version="0.1.0",
        description="화장품 성분 해석 참고 도구 (Phase 1 MVP). 모든 분석 결과는 참고용입니다.",
    )
    app.state.container = container

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    # 요청 컨텍스트 로깅 미들웨어 (지연 import로 순환 의존 방지)
    from src.interfaces.middlewares.request_context import RequestContextMiddleware

    app.add_middleware(RequestContextMiddleware)

    _register_exception_handlers(app)

    app.include_router(health_router.router)
    app.include_router(analysis_router.router, prefix="/api/v1")

    return app


app = create_app()
