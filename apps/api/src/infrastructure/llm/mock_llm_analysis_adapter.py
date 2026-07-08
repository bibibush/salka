"""Mock LLM 분석 어댑터 (Phase 1).

실제 LLM 연동 전까지 사용하는 결정적 구현체. 실제 provider와 동일하게
"구조화된 JSON 출력 → Pydantic 검증 → 실패 시 재시도 1회 → 그래도 실패 시
예외" 흐름을 따른다 (PDD §8). 출력 문구는 금지 단정어를 포함하지 않는다.
구조화 출력 스키마(`RawResult`)와 도메인 매핑은 `raw_result` 모듈을 공유한다.
"""

from __future__ import annotations

from pydantic import ValidationError

from src.application.ports.llm_analysis_port import LlmAnalysisPort
from src.domain.entities.analysis_result import AnalysisResult
from src.domain.exceptions.domain_errors import AnalysisValidationError
from src.domain.value_objects.recommendation import Recommendation
from src.domain.value_objects.verdict import Verdict
from src.infrastructure.llm.raw_result import RawAssessment, RawCaution, RawResult, to_domain

_MAX_VALIDATION_RETRIES = 1


# --- 결정적 성분 지식 베이스 (참고 판단형 문구) ----------------------------------

_KNOWN: dict[str, tuple[int, Verdict, str]] = {
    "water": (80, Verdict.GOOD, "기초 용제로 널리 쓰이는 성분입니다."),
    "glycerin": (88, Verdict.GOOD, "보습 목적으로 흔히 사용되는 성분입니다."),
    "niacinamide": (90, Verdict.GOOD, "보습·장벽 케어 목적으로 자주 쓰이는 성분입니다."),
    "butylene glycol": (78, Verdict.GOOD, "보습·용제 역할로 널리 쓰이는 성분입니다."),
    "dimethicone": (75, Verdict.GOOD, "사용감 개선 목적의 실리콘 성분입니다."),
    "fragrance": (55, Verdict.CAUTION, "향료는 민감 피부에서 자극을 줄 수 있어 참고가 필요합니다."),
    "parfum": (55, Verdict.CAUTION, "향료는 민감 피부에서 자극을 줄 수 있어 참고가 필요합니다."),
    "alcohol": (50, Verdict.CAUTION, "고배합 시 건조함을 느낄 수 있어 참고가 필요한 성분입니다."),
}

_DEFAULT = (70, Verdict.GOOD, "일반적으로 널리 사용되는 성분입니다.")


def _assess_one(ingredient: str) -> RawAssessment:
    score, verdict, reason = _KNOWN.get(ingredient.casefold(), _DEFAULT)
    return RawAssessment(ingredient=ingredient, verdict=verdict, score=score, reason=reason)


def _overall_verdict(score: int) -> Verdict:
    if score >= 75:
        return Verdict.GOOD
    if score >= 50:
        return Verdict.CAUTION
    return Verdict.BAD


def _overall_recommendation(score: int) -> Recommendation:
    if score >= 75:
        return Recommendation.RECOMMENDED
    if score >= 50:
        return Recommendation.NEUTRAL
    return Recommendation.CAUTION_NEEDED


class MockLlmAnalysisAdapter(LlmAnalysisPort):
    """결정적 분석 결과를 생성하는 mock LLM 구현체."""

    async def analyze(self, ingredients: list[str]) -> AnalysisResult:
        raw = self._validate_with_retry(ingredients)
        return to_domain(raw)

    def _generate_raw(self, ingredients: list[str]) -> dict[str, object]:
        assessments = [_assess_one(name) for name in ingredients]
        overall = round(sum(a.score for a in assessments) / len(assessments))
        good_count = sum(1 for a in assessments if a.verdict == Verdict.GOOD)
        cautions = [
            RawCaution(ingredient=a.ingredient, reason=a.reason)
            for a in assessments
            if a.verdict in (Verdict.CAUTION, Verdict.BAD)
        ]
        summary = (
            f"총 {len(assessments)}개 성분 중 {good_count}개가 무난한 편으로 보입니다. "
            "구매 판단에 참고용으로만 활용하세요."
        )
        return {
            "overall_score": overall,
            "verdict": _overall_verdict(overall),
            "summary": summary,
            "recommendation": _overall_recommendation(overall),
            "assessments": [a.model_dump() for a in assessments],
            "cautions": [c.model_dump() for c in cautions],
        }

    def _validate_with_retry(self, ingredients: list[str]) -> RawResult:
        """구조화 출력 검증. 실패 시 재시도 1회 후 예외."""
        last_error: ValidationError | None = None
        for _ in range(_MAX_VALIDATION_RETRIES + 1):
            raw = self._generate_raw(ingredients)
            try:
                return RawResult.model_validate(raw)
            except ValidationError as exc:  # pragma: no cover - mock은 항상 유효
                last_error = exc
        raise AnalysisValidationError(
            "LLM 응답 검증에 반복 실패했습니다."
        ) from last_error
