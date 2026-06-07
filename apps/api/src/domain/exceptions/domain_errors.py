"""도메인/애플리케이션 예외.

interfaces 레이어의 전역 예외 핸들러가 이 예외들을 RFC 7807
(`application/problem+json`) 응답으로 변환한다.
"""

from __future__ import annotations


class DomainError(Exception):
    """모든 도메인/애플리케이션 예외의 베이스."""


class ScoreOutOfRangeError(DomainError):
    """점수가 0~100 범위를 벗어남."""


class EmptyIngredientsError(DomainError):
    """입력 또는 인식 결과에 유효한 성분이 없음 (입력/인식 오류)."""


class OcrExtractionError(DomainError):
    """이미지에서 성분 텍스트를 인식하지 못함."""


class LlmAnalysisError(DomainError):
    """LLM 분석 호출 자체가 실패함 (외부 의존성 오류)."""


class AnalysisValidationError(DomainError):
    """LLM 분석 결과가 검증을 통과하지 못함 (재시도 후에도 실패)."""


class ResponsePolicyError(DomainError):
    """분석 결과 문구가 응답 정책(금지 단정어 등)을 위반함."""
