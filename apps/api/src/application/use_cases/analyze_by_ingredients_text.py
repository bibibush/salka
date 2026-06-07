"""성분 텍스트 입력 분석 use case."""

from __future__ import annotations

from src.application.ports.llm_analysis_port import LlmAnalysisPort
from src.application.services.ingredient_normalizer import normalize_ingredients
from src.application.services.response_policy import enforce_response_policy
from src.domain.entities.analysis_result import AnalysisResult
from src.domain.exceptions.domain_errors import EmptyIngredientsError


class AnalyzeByIngredientsTextUseCase:
    """성분 텍스트 → 정규화 → LLM 분석 → 정책 검증 → 면책 부착."""

    def __init__(self, llm_port: LlmAnalysisPort, disclaimer_text: str) -> None:
        self._llm = llm_port
        self._disclaimer = disclaimer_text

    async def execute(self, raw_text: str) -> AnalysisResult:
        ingredients = normalize_ingredients(raw_text)
        if not ingredients:
            raise EmptyIngredientsError("분석할 성분을 찾지 못했습니다.")

        result = await self._llm.analyze(ingredients)
        result = enforce_response_policy(result)
        return result.with_disclaimer(self._disclaimer)
