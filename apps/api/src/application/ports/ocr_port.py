"""OCR Port (추상 인터페이스).

구현체는 infrastructure 레이어에 위치하며, DI 컨테이너가 환경변수
`OCR_PROVIDER`에 따라 주입한다.
"""

from __future__ import annotations

from typing import Protocol


class OcrPort(Protocol):
    """이미지 바이트에서 성분 텍스트(행 단위)를 인식한다."""

    async def extract_ingredients(self, image: bytes) -> list[str]:
        """이미지에서 인식한 성분 텍스트 조각들을 반환한다.

        이미지는 메모리에서만 처리하고 디스크에 저장하지 않는다 (PDD §9, §13).
        인식 실패 시 `OcrExtractionError`를 던질 수 있다.
        """
        ...
