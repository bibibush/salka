"""Gemini OCR 어댑터 단위 테스트 (fake client, 네트워크 없음)."""

from __future__ import annotations

import pytest
from google.genai import errors
from src.domain.exceptions.domain_errors import OcrExtractionError
from src.infrastructure.ocr.gemini_ocr_adapter import GeminiOcrAdapter

# 최소 유효 JPEG 매직바이트 (내용은 무의미, mime 판별용)
_JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"0" * 16


# --- google-genai Interactions API 응답/클라이언트 형태를 흉내 내는 fake -------


class _FakeInteraction:
    def __init__(self, output_text: str | None) -> None:
        self.output_text = output_text


class _FakeInteractions:
    def __init__(self, text: str | None = None, raises: Exception | None = None) -> None:
        self._text = text
        self._raises = raises
        self.calls: list[dict[str, object]] = []

    async def create(self, **kwargs: object) -> _FakeInteraction:
        self.calls.append(kwargs)
        if self._raises is not None:
            raise self._raises
        return _FakeInteraction(self._text)


class _FakeAio:
    def __init__(self, interactions: _FakeInteractions) -> None:
        self.interactions = interactions


class _FakeClient:
    def __init__(self, text: str | None = None, raises: Exception | None = None) -> None:
        self.aio = _FakeAio(_FakeInteractions(text, raises))


def _adapter(client: _FakeClient, *, thinking_level: str = "low") -> GeminiOcrAdapter:
    return GeminiOcrAdapter(
        api_key="test-key",
        model="gemini-3.5-flash",
        thinking_level=thinking_level,  # type: ignore[arg-type]
        client=client,
    )


async def test_extract_splits_text_into_lines() -> None:
    adapter = _adapter(_FakeClient(text="Water\nGlycerin\n  Niacinamide  \n\n"))
    result = await adapter.extract_ingredients(_JPEG_BYTES)
    assert result == ["Water", "Glycerin", "Niacinamide"]


async def test_thinking_level_forwarded_to_model_call() -> None:
    client = _FakeClient(text="Water")
    adapter = _adapter(client, thinking_level="high")
    await adapter.extract_ingredients(_JPEG_BYTES)
    call = client.aio.interactions.calls[0]
    assert call["generation_config"] == {"thinking_level": "high"}


async def test_extract_empty_image_raises() -> None:
    adapter = _adapter(_FakeClient(text="ignored"))
    with pytest.raises(OcrExtractionError):
        await adapter.extract_ingredients(b"")


async def test_extract_api_error_wrapped() -> None:
    adapter = _adapter(_FakeClient(raises=errors.APIError(500, {})))
    with pytest.raises(OcrExtractionError):
        await adapter.extract_ingredients(_JPEG_BYTES)


def test_missing_api_key_fails_fast() -> None:
    with pytest.raises(ValueError):
        GeminiOcrAdapter(api_key=None, model="gemini-3.5-flash")
