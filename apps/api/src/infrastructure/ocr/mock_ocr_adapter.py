"""Mock OCR 어댑터 (Phase 1).

실제 OCR 연동 전까지 사용하는 결정적 구현체. 이미지 바이트는 디스크에
저장하지 않고, 비어 있지 않은지만 확인한 뒤 고정 성분 리스트를 반환한다.
"""

from __future__ import annotations

from src.application.ports.ocr_port import OcrPort
from src.domain.exceptions.domain_errors import OcrExtractionError

# 결정적 mock 인식 결과 (전성분 표기 형태를 모사)
_MOCK_EXTRACTED = [
    "Water",
    "Glycerin",
    "Niacinamide",
    "Butylene Glycol",
    "Dimethicone",
    "Fragrance",
]


class MockOcrAdapter(OcrPort):
    """고정된 성분 리스트를 반환하는 mock OCR 구현체."""

    async def extract_ingredients(self, image: bytes) -> list[str]:
        if not image:
            raise OcrExtractionError("빈 이미지에서는 성분을 인식할 수 없습니다.")
        return list(_MOCK_EXTRACTED)
