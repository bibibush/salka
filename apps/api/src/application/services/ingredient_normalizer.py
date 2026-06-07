"""성분 텍스트 정규화 (순수 함수).

OCR/텍스트 입력으로 들어온 원문을 분석 가능한 성분명 리스트로 변환한다.
PDD §8: 구분자 split, 공백/특수문자 정리, 중복 제거.
"""

from __future__ import annotations

import re

# 성분 구분자: 콤마, 전각 쉼표, 가운뎃점, 세미콜론, 슬래시, 줄바꿈, 파이프
_SPLIT_PATTERN = re.compile(r"[,，·•;/\n\r|]+")  # noqa: RUF001 (전각 쉼표는 의도적)
# 앞뒤로 다듬을 잡 문자 (괄호, 마침표, 따옴표, 공백류)
_STRIP_CHARS = " \t.　\"'()[]{}"
# 내부 다중 공백 → 단일 공백
_WHITESPACE_RUN = re.compile(r"\s+")


def normalize_ingredients(raw: str) -> list[str]:
    """원문 성분 텍스트를 정규화된 성분명 리스트로 변환한다.

    - 구분자로 분리
    - 앞뒤 공백/특수문자 제거, 내부 다중 공백 축약
    - 빈 토큰 제거
    - 대소문자 무시 중복 제거 (입력 순서/원래 표기 유지)
    """
    if not raw:
        return []

    tokens = _SPLIT_PATTERN.split(raw)

    result: list[str] = []
    seen: set[str] = set()
    for token in tokens:
        cleaned = _WHITESPACE_RUN.sub(" ", token.strip(_STRIP_CHARS)).strip()
        if not cleaned:
            continue
        key = cleaned.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(cleaned)

    return result
