"""성분/제품 판정 등급."""

from __future__ import annotations

from enum import StrEnum


class Verdict(StrEnum):
    """개별 성분 또는 전체 결과에 대한 판정 등급.

    단정형이 아닌 참고 판단형 등급이다.
    """

    GOOD = "GOOD"
    CAUTION = "CAUTION"
    BAD = "BAD"
