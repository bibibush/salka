"""pytest 공통 픽스처."""

from __future__ import annotations

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from src.core.config import Settings
from src.main import create_app


@pytest.fixture
def settings() -> Settings:
    """테스트용 설정 (mock provider, 작은 업로드 한도)."""
    return Settings(
        env="dev",
        llm_provider="mock",
        ocr_provider="mock",
        max_upload_bytes=1024,
        disclaimer_text="본 결과는 참고용입니다.",
    )


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    """ASGI 인메모리 HTTP 클라이언트."""
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
