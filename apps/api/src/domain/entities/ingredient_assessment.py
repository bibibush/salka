"""개별 성분 평가 엔티티."""

from __future__ import annotations

from dataclasses import dataclass

from src.domain.value_objects.score import Score
from src.domain.value_objects.verdict import Verdict


@dataclass(frozen=True, slots=True)
class IngredientAssessment:
    """개별 성분에 대한 평가 결과."""

    ingredient: str
    verdict: Verdict
    score: Score
    reason: str


@dataclass(frozen=True, slots=True)
class Caution:
    """주의가 필요한 성분에 대한 참고 메모."""

    ingredient: str
    reason: str
