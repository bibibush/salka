"""성분 정규화 단위 테스트."""

from __future__ import annotations

from src.application.services.ingredient_normalizer import normalize_ingredients


def test_splits_on_multiple_delimiters() -> None:
    raw = "Water, Glycerin·Niacinamide;Butylene Glycol\nDimethicone"
    assert normalize_ingredients(raw) == [
        "Water",
        "Glycerin",
        "Niacinamide",
        "Butylene Glycol",
        "Dimethicone",
    ]


def test_trims_and_collapses_whitespace() -> None:
    assert normalize_ingredients("  Water  ,   Butylene   Glycol ") == [
        "Water",
        "Butylene Glycol",
    ]


def test_dedupes_case_insensitively_preserving_first() -> None:
    assert normalize_ingredients("Water, water, WATER, Glycerin") == ["Water", "Glycerin"]


def test_drops_empty_tokens() -> None:
    assert normalize_ingredients("Water,,, ,Glycerin") == ["Water", "Glycerin"]


def test_empty_input_returns_empty_list() -> None:
    assert normalize_ingredients("") == []
    assert normalize_ingredients("   ,  ; · ") == []
