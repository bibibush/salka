"""LLM 구조화 출력(raw) 스키마 및 도메인 매핑.

실제/mock LLM 어댑터가 공유하는 단일 JSON 스키마 소스다. provider는 이 스키마로
구조화 출력을 강제하고, `to_domain`으로 도메인 엔티티(`AnalysisResult`)에 매핑한다.
스키마 드리프트를 막기 위해 어댑터에 중복 정의하지 않고 이 모듈만 사용한다.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from src.domain.entities.analysis_result import AnalysisResult
from src.domain.entities.ingredient_assessment import Caution, IngredientAssessment
from src.domain.value_objects.recommendation import Recommendation
from src.domain.value_objects.score import Score
from src.domain.value_objects.verdict import Verdict


class RawAssessment(BaseModel):
    ingredient: str
    verdict: Verdict
    score: int = Field(ge=0, le=100)
    reason: str


class RawCaution(BaseModel):
    ingredient: str
    reason: str


class RawResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    verdict: Verdict
    summary: str
    recommendation: Recommendation
    assessments: list[RawAssessment]
    cautions: list[RawCaution]


def to_domain(raw: RawResult) -> AnalysisResult:
    """검증된 raw 출력을 도메인 엔티티로 매핑한다 (int → `Score` 래핑)."""
    return AnalysisResult(
        overall_score=Score(raw.overall_score),
        verdict=raw.verdict,
        summary=raw.summary,
        recommendation=raw.recommendation,
        assessments=[
            IngredientAssessment(
                ingredient=a.ingredient,
                verdict=a.verdict,
                score=Score(a.score),
                reason=a.reason,
            )
            for a in raw.assessments
        ],
        cautions=[Caution(ingredient=c.ingredient, reason=c.reason) for c in raw.cautions],
    )
