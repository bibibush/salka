"""요청 컨텍스트 로깅 미들웨어.

요청마다 request_id를 structlog 컨텍스트에 바인딩하고 시작/종료를 로깅한다.
보안 정책(PDD §13)에 따라 요청 본문(이미지 바이너리 등)은 로깅하지 않는다.
"""

from __future__ import annotations

import uuid
from collections.abc import Awaitable, Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from src.core.logging import get_logger

_logger = get_logger("request")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
        )
        _logger.info("request.start")
        response = await call_next(request)
        _logger.info("request.end", status_code=response.status_code)
        response.headers["x-request-id"] = request_id
        return response
