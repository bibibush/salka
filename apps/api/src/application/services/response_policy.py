"""응답 문구 정책 검증 (PDD §13).

강한 단정 표현("유해", "위험", "안전")은 제품 문구·프롬프트·응답 후처리에서
금지된다. 분석 결과의 사람이 읽는 텍스트 필드를 검사해 위반 시 예외를 던진다.
(프롬프트 단계 차단은 LLM provider 구현체의 책임이며, 여기서는 최종 방어선이다.)
"""

from __future__ import annotations

from collections.abc import Iterable

from src.domain.entities.analysis_result import AnalysisResult
from src.domain.exceptions.domain_errors import ResponsePolicyError

# 금지 단정어 (대소문자/표기 변형 없이 한글 부분 문자열로 검사)
FORBIDDEN_TERMS: tuple[str, ...] = ("유해", "위험", "안전")


def find_forbidden_terms(text: str) -> list[str]:
    """텍스트에 포함된 금지어 목록을 반환한다."""
    if not text:
        return []
    return [term for term in FORBIDDEN_TERMS if term in text]


def _iter_text_fields(result: AnalysisResult) -> Iterable[str]:
    yield result.summary
    for assessment in result.assessments:
        yield assessment.reason
    for caution in result.cautions:
        yield caution.reason


def enforce_response_policy(result: AnalysisResult) -> AnalysisResult:
    """분석 결과 문구가 정책을 위반하면 `ResponsePolicyError`를 던진다.

    면책 문구(disclaimer)는 정책 검사 대상이 아니다(고정 문구).
    """
    violations: set[str] = set()
    for text in _iter_text_fields(result):
        violations.update(find_forbidden_terms(text))

    if violations:
        raise ResponsePolicyError(
            "분석 결과에 금지된 단정 표현이 포함되어 있습니다: "
            + ", ".join(sorted(violations))
        )

    return result
