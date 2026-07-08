"""Gemini 비전 기반 OCR 어댑터.

최신 Interactions API(`client.aio.interactions.create`)로 이미지 바이트에서 전성분
표기를 인식해 줄 단위 텍스트 조각으로 반환한다. 이미지는 메모리에서만 처리하고
디스크에 저장하지 않는다 (PDD §9, §13). 정규화·중복 제거는 use case의
`normalize_ingredients`가 담당하므로 여기서는 모델이 인식한 줄만 정리해 반환한다.
"""

from __future__ import annotations

import base64
from typing import Literal, cast

from google import genai
from google.genai import errors
from google.genai.interactions import Interaction

from src.application.ports.ocr_port import OcrPort
from src.domain.exceptions.domain_errors import OcrExtractionError

# Gemini 추론 강도(thinking level). OpenAI reasoning effort 와 동일 값 체계.
ThinkingLevel = Literal["minimal", "low", "medium", "high"]

_OCR_PROMPT = (
    "이 이미지는 화장품 용기의 전성분 표기입니다. "
    "표기된 성분명만 인식해 한 줄에 하나씩 나열하세요. "
    "성분명 외의 설명, 번호, 문장은 포함하지 마세요."
)


def _detect_mime(image: bytes) -> str:
    """이미지 매직바이트로 mime 타입을 판별한다 (기본 image/jpeg)."""
    if image.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if image.startswith(b"GIF8"):
        return "image/gif"
    if image[:4] == b"RIFF" and image[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


class GeminiOcrAdapter(OcrPort):
    """Gemini 비전 모델(Interactions API)로 전성분을 인식하는 OCR 구현체."""

    def __init__(
        self,
        *,
        api_key: str | None,
        model: str,
        thinking_level: ThinkingLevel = "low",
        client: genai.Client | None = None,
    ) -> None:
        if not api_key and client is None:
            raise ValueError("Gemini API 키가 설정되지 않았습니다. OCR_API_KEY를 지정하세요.")
        self._model = model
        self._thinking_level = thinking_level
        self._client = client or genai.Client(api_key=api_key)

    async def extract_ingredients(self, image: bytes) -> list[str]:
        if not image:
            raise OcrExtractionError("빈 이미지에서는 성분을 인식할 수 없습니다.")

        encoded = base64.b64encode(image).decode("ascii")
        try:
            result = await self._client.aio.interactions.create(
                model=self._model,
                input=[
                    {"type": "text", "text": _OCR_PROMPT},
                    {"type": "image", "data": encoded, "mime_type": _detect_mime(image)},
                ],
                generation_config={"thinking_level": self._thinking_level},
            )
        except errors.APIError as exc:
            raise OcrExtractionError("Gemini OCR 호출에 실패했습니다.") from exc

        interaction = cast(Interaction, result)
        text = interaction.output_text or ""
        return [line.strip() for line in text.splitlines() if line.strip()]
