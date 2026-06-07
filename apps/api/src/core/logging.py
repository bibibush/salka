"""structlog 기반 JSON 로깅 설정.

보안 정책(PDD §13)에 따라 이미지 바이너리나 PII는 로그에 포함하지 않는다.
로깅 호출부에서 바이너리/원문 텍스트를 직접 넘기지 않도록 주의한다.
"""

from __future__ import annotations

import logging
from typing import cast

import structlog


def configure_logging(*, env: str = "dev") -> None:
    """프로세스 전역 structlog 설정을 구성한다."""

    shared_processors: list[structlog.typing.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if env == "dev":
        renderer: structlog.typing.Processor = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, structlog.processors.format_exc_info, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """structlog 로거를 반환한다."""
    return cast("structlog.stdlib.BoundLogger", structlog.get_logger(name))
