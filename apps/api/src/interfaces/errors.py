"""인터페이스 레이어 오류 표현.

도메인 예외와 별개로, HTTP 입력 검증(이미지 타입/크기 등)에서 발생하는
오류를 RFC 7807 응답으로 직접 매핑하기 위한 예외.
"""

from __future__ import annotations


class ProblemException(Exception):
    """RFC 7807 problem 응답으로 변환되는 인터페이스 예외."""

    def __init__(
        self,
        *,
        status: int,
        title: str,
        detail: str | None = None,
        type_: str = "about:blank",
    ) -> None:
        super().__init__(detail or title)
        self.status = status
        self.title = title
        self.detail = detail
        self.type = type_
