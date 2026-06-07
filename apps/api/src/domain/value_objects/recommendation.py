"""구매 판단 보조용 추천 등급."""

from __future__ import annotations

from enum import StrEnum


class Recommendation(StrEnum):
    """전체 분석 결과에 대한 참고 판단형 추천 등급.

    단정 표현을 피하고 참고 판단형만 사용한다 (PDD §6).
    """

    RECOMMENDED = "RECOMMENDED"
    NEUTRAL = "NEUTRAL"
    CAUTION_NEEDED = "CAUTION_NEEDED"
