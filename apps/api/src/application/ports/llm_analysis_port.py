"""LLM 분석 Port (추상 인터페이스).

구현체는 infrastructure 레이어에 위치하며, DI 컨테이너가 환경변수
`LLM_PROVIDER`에 따라 주입한다. application/domain은 이 Protocol에만 의존한다.
"""

from __future__ import annotations

from typing import Protocol

from src.domain.entities.analysis_result import AnalysisResult


class LlmAnalysisPort(Protocol):
    """성분 리스트를 받아 구조화된 분석 결과를 반환한다."""

    async def analyze(self, ingredients: list[str]) -> AnalysisResult:
        """정규화된 성분명 리스트를 분석해 `AnalysisResult`를 반환한다.

        구조화 출력(JSON schema) 강제 및 검증/재시도는 구현체 책임이다.
        호출 실패 시 `LlmAnalysisError`, 검증 실패(재시도 소진) 시
        `AnalysisValidationError`를 던진다.
        """
        ...
