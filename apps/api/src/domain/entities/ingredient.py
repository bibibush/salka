"""성분 엔티티."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Ingredient:
    """화장품 성분.

    name: 표기명 (입력/인식된 원문 기준)
    inci_name: INCI 표준명 (선택)
    category: 성분 분류 (선택)
    """

    name: str
    inci_name: str | None = None
    category: str | None = None
