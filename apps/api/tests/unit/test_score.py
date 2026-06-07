"""Score 값 객체 단위 테스트."""

from __future__ import annotations

import pytest
from src.domain.exceptions.domain_errors import ScoreOutOfRangeError
from src.domain.value_objects.score import Score


@pytest.mark.parametrize("value", [0, 1, 50, 99, 100])
def test_valid_scores(value: int) -> None:
    assert int(Score(value)) == value


@pytest.mark.parametrize("value", [-1, 101, 1000])
def test_out_of_range_raises(value: int) -> None:
    with pytest.raises(ScoreOutOfRangeError):
        Score(value)


def test_bool_is_rejected() -> None:
    with pytest.raises(ScoreOutOfRangeError):
        Score(True)  # type: ignore[arg-type]
