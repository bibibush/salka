"""0~100 범위의 점수 값 객체."""

from __future__ import annotations

from dataclasses import dataclass

from src.domain.exceptions.domain_errors import ScoreOutOfRangeError

SCORE_MIN = 0
SCORE_MAX = 100


@dataclass(frozen=True, slots=True)
class Score:
    """0~100 정수 점수.

    범위를 벗어나면 도메인 예외를 던진다.
    """

    value: int

    def __post_init__(self) -> None:
        if not isinstance(self.value, int) or isinstance(self.value, bool):
            raise ScoreOutOfRangeError(f"점수는 정수여야 합니다: {self.value!r}")
        if not (SCORE_MIN <= self.value <= SCORE_MAX):
            raise ScoreOutOfRangeError(
                f"점수는 {SCORE_MIN}~{SCORE_MAX} 범위여야 합니다: {self.value}"
            )

    def __int__(self) -> int:
        return self.value
