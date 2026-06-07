"""분석 결과 엔티티."""

from __future__ import annotations

from dataclasses import dataclass, field

from src.domain.entities.ingredient_assessment import Caution, IngredientAssessment
from src.domain.value_objects.recommendation import Recommendation
from src.domain.value_objects.score import Score
from src.domain.value_objects.verdict import Verdict


@dataclass(frozen=True, slots=True)
class AnalysisResult:
    """전체 성분 분석 결과.

    disclaimer는 도메인 단계에서 비어 있을 수 있으며,
    응답 직전 use case에서 면책 문구가 반드시 채워진다 (PDD §7, §13).
    """

    overall_score: Score
    verdict: Verdict
    summary: str
    recommendation: Recommendation
    assessments: list[IngredientAssessment] = field(default_factory=list)
    cautions: list[Caution] = field(default_factory=list)
    disclaimer: str = ""

    def with_disclaimer(self, disclaimer: str) -> AnalysisResult:
        """면책 문구를 부착한 새 결과를 반환한다 (불변)."""
        return AnalysisResult(
            overall_score=self.overall_score,
            verdict=self.verdict,
            summary=self.summary,
            recommendation=self.recommendation,
            assessments=self.assessments,
            cautions=self.cautions,
            disclaimer=disclaimer,
        )
