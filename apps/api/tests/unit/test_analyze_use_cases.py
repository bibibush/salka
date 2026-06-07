"""분석 use case 단위 테스트 (mock 어댑터 사용)."""

from __future__ import annotations

import pytest
from src.application.use_cases.analyze_by_ingredients_image import (
    AnalyzeByIngredientsImageUseCase,
)
from src.application.use_cases.analyze_by_ingredients_text import (
    AnalyzeByIngredientsTextUseCase,
)
from src.domain.exceptions.domain_errors import EmptyIngredientsError, OcrExtractionError
from src.infrastructure.llm.mock_llm_analysis_adapter import MockLlmAnalysisAdapter
from src.infrastructure.ocr.mock_ocr_adapter import MockOcrAdapter

_DISCLAIMER = "참고용 결과입니다."


async def test_text_use_case_attaches_disclaimer() -> None:
    use_case = AnalyzeByIngredientsTextUseCase(MockLlmAnalysisAdapter(), _DISCLAIMER)
    result = await use_case.execute("Water, Niacinamide, Fragrance")

    assert result.disclaimer == _DISCLAIMER
    assert len(result.assessments) == 3
    assert 0 <= result.overall_score.value <= 100
    # Fragrance는 주의 성분으로 cautions에 포함
    assert any(c.ingredient == "Fragrance" for c in result.cautions)


async def test_text_use_case_empty_raises() -> None:
    use_case = AnalyzeByIngredientsTextUseCase(MockLlmAnalysisAdapter(), _DISCLAIMER)
    with pytest.raises(EmptyIngredientsError):
        await use_case.execute("  , ; · ")


async def test_image_use_case_pipeline() -> None:
    use_case = AnalyzeByIngredientsImageUseCase(
        MockOcrAdapter(), MockLlmAnalysisAdapter(), _DISCLAIMER
    )
    result = await use_case.execute(b"fake-image-bytes")

    assert result.disclaimer == _DISCLAIMER
    assert len(result.assessments) >= 1


async def test_image_use_case_empty_image_raises() -> None:
    use_case = AnalyzeByIngredientsImageUseCase(
        MockOcrAdapter(), MockLlmAnalysisAdapter(), _DISCLAIMER
    )
    with pytest.raises(OcrExtractionError):
        await use_case.execute(b"")
