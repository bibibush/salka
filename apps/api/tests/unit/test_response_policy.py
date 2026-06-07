"""응답 정책(금지 단정어) 단위 테스트."""

from __future__ import annotations

import pytest
from src.application.services.response_policy import (
    enforce_response_policy,
    find_forbidden_terms,
)
from src.domain.entities.analysis_result import AnalysisResult
from src.domain.entities.ingredient_assessment import Caution, IngredientAssessment
from src.domain.exceptions.domain_errors import ResponsePolicyError
from src.domain.value_objects.recommendation import Recommendation
from src.domain.value_objects.score import Score
from src.domain.value_objects.verdict import Verdict


def _result(summary: str = "무난한 편입니다.", reason: str = "널리 쓰입니다.") -> AnalysisResult:
    return AnalysisResult(
        overall_score=Score(80),
        verdict=Verdict.GOOD,
        summary=summary,
        recommendation=Recommendation.RECOMMENDED,
        assessments=[
            IngredientAssessment(
                ingredient="Water", verdict=Verdict.GOOD, score=Score(80), reason=reason
            )
        ],
        cautions=[],
    )


def test_find_forbidden_terms() -> None:
    assert find_forbidden_terms("이 성분은 위험합니다") == ["위험"]
    assert find_forbidden_terms("무난한 편") == []


def test_clean_result_passes() -> None:
    result = _result()
    assert enforce_response_policy(result) is result


@pytest.mark.parametrize("bad_word", ["유해", "위험", "안전"])
def test_summary_violation_raises(bad_word: str) -> None:
    with pytest.raises(ResponsePolicyError):
        enforce_response_policy(_result(summary=f"이 제품은 {bad_word}합니다"))


def test_caution_reason_violation_raises() -> None:
    result = AnalysisResult(
        overall_score=Score(60),
        verdict=Verdict.CAUTION,
        summary="참고가 필요합니다.",
        recommendation=Recommendation.NEUTRAL,
        assessments=[],
        cautions=[Caution(ingredient="Fragrance", reason="위험 가능성 있음")],
    )
    with pytest.raises(ResponsePolicyError):
        enforce_response_policy(result)
