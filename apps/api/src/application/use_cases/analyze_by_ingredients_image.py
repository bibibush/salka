"""성분 이미지 입력 분석 use case."""

from __future__ import annotations

from src.application.ports.llm_analysis_port import LlmAnalysisPort
from src.application.ports.ocr_port import OcrPort
from src.application.services.ingredient_normalizer import normalize_ingredients
from src.application.services.response_policy import enforce_response_policy
from src.domain.entities.analysis_result import AnalysisResult
from src.domain.exceptions.domain_errors import OcrExtractionError


class AnalyzeByIngredientsImageUseCase:
    """이미지 → OCR → 정규화 → LLM 분석 → 정책 검증 → 면책 부착.

    이미지는 메모리에서만 처리되며 디스크에 저장하지 않는다 (PDD §9, §13).
    """

    def __init__(
        self,
        ocr_port: OcrPort,
        llm_port: LlmAnalysisPort,
        disclaimer_text: str,
    ) -> None:
        self._ocr = ocr_port
        self._llm = llm_port
        self._disclaimer = disclaimer_text

    async def execute(self, image: bytes) -> AnalysisResult:
        extracted = await self._ocr.extract_ingredients(image)
        ingredients = normalize_ingredients("\n".join(extracted))
        if not ingredients:
            raise OcrExtractionError("이미지에서 성분을 인식하지 못했습니다.")

        result = await self._llm.analyze(ingredients)
        result = enforce_response_policy(result)
        return result.with_disclaimer(self._disclaimer)
