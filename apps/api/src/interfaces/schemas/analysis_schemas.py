"""분석 API 요청/응답 Pydantic 스키마 및 도메인 매퍼."""

from __future__ import annotations

from pydantic import BaseModel, Field

from src.domain.entities.analysis_result import AnalysisResult
from src.domain.value_objects.recommendation import Recommendation
from src.domain.value_objects.verdict import Verdict


class AnalyzeByTextRequest(BaseModel):
    """성분 텍스트 분석 요청."""

    ingredients: str = Field(
        min_length=1,
        description="전성분 텍스트. 콤마/줄바꿈 등 구분자로 나열.",
        examples=["Water, Glycerin, Niacinamide, Fragrance"],
    )


class IngredientAssessmentSchema(BaseModel):
    ingredient: str
    verdict: Verdict
    score: int
    reason: str


class CautionSchema(BaseModel):
    ingredient: str
    reason: str


class AnalysisResultSchema(BaseModel):
    """분석 결과 응답. 면책 문구(disclaimer)가 항상 포함된다."""

    overall_score: int
    verdict: Verdict
    summary: str
    recommendation: Recommendation
    assessments: list[IngredientAssessmentSchema]
    cautions: list[CautionSchema]
    disclaimer: str

    @classmethod
    def from_domain(cls, result: AnalysisResult) -> AnalysisResultSchema:
        """도메인 `AnalysisResult`를 응답 스키마로 변환한다."""
        return cls(
            overall_score=result.overall_score.value,
            verdict=result.verdict,
            summary=result.summary,
            recommendation=result.recommendation,
            assessments=[
                IngredientAssessmentSchema(
                    ingredient=a.ingredient,
                    verdict=a.verdict,
                    score=a.score.value,
                    reason=a.reason,
                )
                for a in result.assessments
            ],
            cautions=[
                CautionSchema(ingredient=c.ingredient, reason=c.reason)
                for c in result.cautions
            ],
            disclaimer=result.disclaimer,
        )
